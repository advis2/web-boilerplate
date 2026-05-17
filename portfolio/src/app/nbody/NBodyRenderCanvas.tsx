"use client";

import React, { useEffect, useRef } from "react";

interface NBodyModuleLike {
  _nbody_step: (dt: number, G: number, softening: number) => void;
  _nbody_get_particle_buffer: () => number;
  WebGPU: {
    mgrBuffer: { get: (handle: number) => GPUBuffer };
  };
}

interface Props {
  module: NBodyModuleLike;
  device: GPUDevice;
  particleCount: number;
  dt: number;
  G: number;
  softening: number;
  onStats?: (s: { fps: number; stepMs: number }) => void;
}

const RENDER_WGSL = `
struct Particle {
  pos : vec3<f32>,
  _p0 : f32,
  vel : vec3<f32>,
  _p1 : f32,
};

struct Camera {
  viewProj  : mat4x4<f32>,
  pointSize : f32,
  _pad0 : f32,
  _pad1 : f32,
  _pad2 : f32,
};

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<uniform>        cam       : Camera;

struct VOut {
  @builtin(position) pos : vec4<f32>,
  @location(0)       color : vec3<f32>,
  @location(1)       uv : vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> VOut {
  var quad = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0),
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0,  1.0), vec2<f32>(-1.0,  1.0)
  );
  let local = quad[vi];
  let p = particles[ii];
  var clip = cam.viewProj * vec4<f32>(p.pos, 1.0);
  clip = vec4<f32>(
    clip.x + local.x * cam.pointSize * clip.w,
    clip.y + local.y * cam.pointSize * clip.w,
    clip.z, clip.w
  );
  let speed = length(p.vel);
  let col = mix(vec3<f32>(0.3, 0.65, 1.0), vec3<f32>(1.0, 0.55, 0.2), clamp(speed * 0.5, 0.0, 1.0));
  var out: VOut;
  out.pos = clip;
  out.color = col;
  out.uv = local;
  return out;
}

@fragment
fn fs(in : VOut) -> @location(0) vec4<f32> {
  let d = length(in.uv);
  if (d > 1.0) { discard; }
  let alpha = smoothstep(1.0, 0.0, d);
  return vec4<f32>(in.color * alpha, alpha);
}
`;

// Column-major mat4 (WGSL convention)
function mat4Mul(a: Float32Array, b: Float32Array): Float32Array {
  const r = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let row = 0; row < 4; row++) {
      r[c * 4 + row] =
        a[0 * 4 + row] * b[c * 4 + 0] +
        a[1 * 4 + row] * b[c * 4 + 1] +
        a[2 * 4 + row] * b[c * 4 + 2] +
        a[3 * 4 + row] * b[c * 4 + 3];
    }
  }
  return r;
}

function mat4Perspective(fovy: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovy / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = far / (near - far);
  m[11] = -1;
  m[14] = (near * far) / (near - far);
  return m;
}

function mat4LookAt(
  eye: [number, number, number],
  center: [number, number, number],
  up: [number, number, number],
): Float32Array {
  const [ex, ey, ez] = eye;
  const [cx, cy, cz] = center;
  let fx = cx - ex, fy = cy - ey, fz = cz - ez;
  const fl = Math.hypot(fx, fy, fz);
  fx /= fl; fy /= fl; fz /= fl;
  let sx = fy * up[2] - fz * up[1];
  let sy = fz * up[0] - fx * up[2];
  let sz = fx * up[1] - fy * up[0];
  const sl = Math.hypot(sx, sy, sz);
  sx /= sl; sy /= sl; sz /= sl;
  const ux = sy * fz - sz * fy;
  const uy = sz * fx - sx * fz;
  const uz = sx * fy - sy * fx;
  const m = new Float32Array(16);
  m[0] = sx; m[1] = ux; m[2] = -fx; m[3] = 0;
  m[4] = sy; m[5] = uy; m[6] = -fy; m[7] = 0;
  m[8] = sz; m[9] = uz; m[10] = -fz; m[11] = 0;
  m[12] = -(sx * ex + sy * ey + sz * ez);
  m[13] = -(ux * ex + uy * ey + uz * ez);
  m[14] = (fx * ex + fy * ey + fz * ez);
  m[15] = 1;
  return m;
}

export default function NBodyRenderCanvas({
  module,
  device,
  particleCount,
  dt,
  G,
  softening,
  onStats,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef({ dt, G, softening });
  paramsRef.current = { dt, G, softening };
  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let rafId: number | undefined;

    const context = canvas.getContext("webgpu") as GPUCanvasContext;
    if (!context) return;

    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: "opaque" });

    // C++가 만든 particle buffer를 JS GPUBuffer로 받음
    const particleHandle = module._nbody_get_particle_buffer();
    const particleBuffer = module.WebGPU.mgrBuffer.get(particleHandle);
    if (!particleBuffer) {
      console.error("nbody: particleBuffer not found in WebGPU.mgrBuffer");
      return;
    }

    // Camera uniform
    const cameraBuf = device.createBuffer({
      size: 80, // mat4 (64) + pointSize + pad x3 (16)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Render BGL
    const renderBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
        { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
      ],
    });

    const renderBindGroup = device.createBindGroup({
      layout: renderBGL,
      entries: [
        { binding: 0, resource: { buffer: particleBuffer } },
        { binding: 1, resource: { buffer: cameraBuf } },
      ],
    });

    const renderModule = device.createShaderModule({ code: RENDER_WGSL });
    const renderPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [renderBGL] }),
      vertex: { module: renderModule, entryPoint: "vs" },
      fragment: {
        module: renderModule,
        entryPoint: "fs",
        targets: [
          {
            format,
            blend: {
              color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
              alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list" },
      depthStencil: { format: "depth24plus", depthWriteEnabled: true, depthCompare: "less" },
    });

    // Camera (isometric)
    const cam = {
      yaw: Math.PI / 4,
      pitch: Math.atan(1 / Math.SQRT2),
      distance: 6,
      pointSize: 0.014,
    };

    let depthTex: GPUTexture | undefined;
    function ensureDepth(w: number, h: number) {
      if (depthTex && depthTex.width === w && depthTex.height === h) return;
      depthTex?.destroy();
      depthTex = device.createTexture({
        size: [w, h],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }

    // Mouse interaction
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      cam.yaw += dx * 0.005;
      cam.pitch = Math.max(-1.4, Math.min(1.4, cam.pitch + dy * 0.005));
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      canvas.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cam.distance = Math.max(2, Math.min(30, cam.distance * (1 + e.deltaY * 0.001)));
    };
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    let frameCount = 0;
    let lastStatsTime = performance.now();
    let stepTimeSum = 0;

    const frame = () => {
      if (disposed) return;

      // Canvas size 동기화
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor((canvas.clientWidth || 800) * dpr));
      const h = Math.max(1, Math.floor((canvas.clientHeight || 600) * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ensureDepth(w, h);

      // 1. C++ compute step
      const t0 = performance.now();
      module._nbody_step(paramsRef.current.dt, paramsRef.current.G, paramsRef.current.softening);
      const t1 = performance.now();
      stepTimeSum += t1 - t0;

      // 2. Camera uniform 업데이트
      const aspect = w / h;
      const proj = mat4Perspective(Math.PI / 3, aspect, 0.5, 50);
      const ex = Math.cos(cam.pitch) * Math.sin(cam.yaw) * cam.distance;
      const ey = Math.sin(cam.pitch) * cam.distance;
      const ez = Math.cos(cam.pitch) * Math.cos(cam.yaw) * cam.distance;
      const view = mat4LookAt([ex, ey, ez], [0, 0, 0], [0, 1, 0]);
      const viewProj = mat4Mul(proj, view);

      const camData = new Float32Array(20);
      camData.set(viewProj, 0);
      camData[16] = cam.pointSize;
      device.queue.writeBuffer(cameraBuf, 0, camData);

      // 3. Render pass
      const encoder = device.createCommandEncoder();
      const colorView = context.getCurrentTexture().createView();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: colorView,
            clearValue: { r: 0.03, g: 0.05, b: 0.12, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
        depthStencilAttachment: {
          view: depthTex!.createView(),
          depthClearValue: 1,
          depthLoadOp: "clear",
          depthStoreOp: "store",
        },
      });
      pass.setPipeline(renderPipeline);
      pass.setBindGroup(0, renderBindGroup);
      pass.draw(6, particleCount);
      pass.end();
      device.queue.submit([encoder.finish()]);

      frameCount++;
      const now = performance.now();
      if (now - lastStatsTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (now - lastStatsTime));
        const stepMs = stepTimeSum / frameCount;
        onStatsRef.current?.({ fps, stepMs });
        frameCount = 0;
        stepTimeSum = 0;
        lastStatsTime = now;
      }

      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      depthTex?.destroy();
    };
  }, [module, device, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "#000",
        cursor: "grab",
      }}
    />
  );
}
