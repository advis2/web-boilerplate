"use client";

import React, { useEffect, useRef } from "react";

interface MeshModuleLike {
  _mesh_step: (time: number, amplitude: number, frequency: number) => void;
  _mesh_get_vertex_buffer: () => number;
  _mesh_get_index_buffer: () => number;
  _mesh_get_index_count: () => number;
  WebGPU: {
    mgrBuffer: { get: (handle: number) => GPUBuffer };
  };
}

interface Props {
  module: MeshModuleLike;
  device: GPUDevice;
  amplitude: number;
  frequency: number;
  wireframe: boolean;
  paused: boolean;
  onStats?: (s: { fps: number; stepMs: number }) => void;
}

const SCENE_HALF = 2;

const RENDER_WGSL = `
struct Camera {
  viewProj : mat4x4<f32>,
  lightDir : vec3<f32>,
  _pad     : f32,
};

@group(0) @binding(0) var<uniform> cam : Camera;

struct VIn {
  @location(0) pos    : vec3<f32>,
  @location(1) normal : vec3<f32>,
};

struct VOut {
  @builtin(position) clipPos     : vec4<f32>,
  @location(0)       worldNormal : vec3<f32>,
};

@vertex
fn vs(in : VIn) -> VOut {
  var out : VOut;
  out.clipPos     = cam.viewProj * vec4<f32>(in.pos, 1.0);
  out.worldNormal = in.normal;
  return out;
}

@fragment
fn fs(in : VOut) -> @location(0) vec4<f32> {
  let n = normalize(in.worldNormal);
  let l = normalize(cam.lightDir);
  let diffuse = max(dot(n, l), 0.0);
  let ambient = 0.22;
  let intensity = ambient + diffuse * 0.78;
  let baseColor = vec3<f32>(0.45, 0.72, 1.0);
  return vec4<f32>(baseColor * intensity, 1.0);
}
`;

const LINE_WGSL = `
struct Camera {
  viewProj : mat4x4<f32>,
  lightDir : vec3<f32>,
  _pad     : f32,
};

@group(0) @binding(0) var<uniform> cam : Camera;

struct VOut {
  @builtin(position) pos   : vec4<f32>,
  @location(0)       color : vec3<f32>,
};

@vertex
fn vs(@location(0) pos : vec3<f32>, @location(1) col : vec3<f32>) -> VOut {
  var out : VOut;
  out.pos   = cam.viewProj * vec4<f32>(pos, 1.0);
  out.color = col;
  return out;
}

@fragment
fn fs(in : VOut) -> @location(0) vec4<f32> {
  return vec4<f32>(in.color, 1.0);
}
`;

function buildSceneLines(half: number): Float32Array {
  const vs: number[] = [];
  const push = (
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cr: number, cg: number, cb: number,
  ) => {
    vs.push(ax, ay, az, cr, cg, cb, bx, by, bz, cr, cg, cb);
  };
  push(0, 0, 0, half * 0.4, 0, 0, 0.9, 0.25, 0.25);
  push(0, 0, 0, 0, half * 0.4, 0, 0.25, 0.9, 0.25);
  push(0, 0, 0, 0, 0, half * 0.4, 0.25, 0.4, 1.0);
  const c = 0.32;
  push(-half, -half, -half,  half, -half, -half, c, c, c);
  push( half, -half, -half,  half, -half,  half, c, c, c);
  push( half, -half,  half, -half, -half,  half, c, c, c);
  push(-half, -half,  half, -half, -half, -half, c, c, c);
  push(-half,  half, -half,  half,  half, -half, c, c, c);
  push( half,  half, -half,  half,  half,  half, c, c, c);
  push( half,  half,  half, -half,  half,  half, c, c, c);
  push(-half,  half,  half, -half,  half, -half, c, c, c);
  push(-half, -half, -half, -half,  half, -half, c, c, c);
  push( half, -half, -half,  half,  half, -half, c, c, c);
  push( half, -half,  half,  half,  half,  half, c, c, c);
  push(-half, -half,  half, -half,  half,  half, c, c, c);
  const g = 0.18;
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = -half + (2 * half * i) / steps;
    push(-half, -half, t,  half, -half, t,  g, g, g);
    push(t, -half, -half,  t, -half,  half,  g, g, g);
  }
  const arr = new Float32Array(vs.length);
  arr.set(vs);
  return arr;
}

// Column-major mat4
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

export default function MeshCanvas({
  module,
  device,
  amplitude,
  frequency,
  wireframe,
  paused,
  onStats,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef({ amplitude, frequency, wireframe, paused });
  paramsRef.current = { amplitude, frequency, wireframe, paused };
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

    // C++가 만든 buffer 받기
    const vertexHandle = module._mesh_get_vertex_buffer();
    const indexHandle  = module._mesh_get_index_buffer();
    const indexCount   = module._mesh_get_index_count();
    const vertexBuffer = module.WebGPU.mgrBuffer.get(vertexHandle);
    const indexBuffer  = module.WebGPU.mgrBuffer.get(indexHandle);
    if (!vertexBuffer || !indexBuffer) {
      console.error("mesh: vertex or index buffer not found");
      return;
    }

    // Camera uniform
    const cameraBuf = device.createBuffer({
      size: 80, // mat4 (64) + vec3 lightDir + pad (16)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const renderBGL = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: "uniform" } },
      ],
    });
    const renderBindGroup = device.createBindGroup({
      layout: renderBGL,
      entries: [{ binding: 0, resource: { buffer: cameraBuf } }],
    });

    const renderShader = device.createShaderModule({ code: RENDER_WGSL });
    const renderPipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [renderBGL] });

    const vertexLayout: GPUVertexBufferLayout = {
      arrayStride: 32, // vec3 pos + pad + vec3 normal + pad
      attributes: [
        { shaderLocation: 0, offset: 0,  format: "float32x3" },
        { shaderLocation: 1, offset: 16, format: "float32x3" },
      ],
    };

    const meshPipeline = device.createRenderPipeline({
      layout: renderPipelineLayout,
      vertex: { module: renderShader, entryPoint: "vs", buffers: [vertexLayout] },
      fragment: { module: renderShader, entryPoint: "fs", targets: [{ format }] },
      primitive: { topology: "triangle-list", cullMode: "back" },
      depthStencil: { format: "depth24plus", depthWriteEnabled: true, depthCompare: "less" },
    });

    const meshWireframePipeline = device.createRenderPipeline({
      layout: renderPipelineLayout,
      vertex: { module: renderShader, entryPoint: "vs", buffers: [vertexLayout] },
      fragment: { module: renderShader, entryPoint: "fs", targets: [{ format }] },
      primitive: { topology: "line-list" },
      depthStencil: { format: "depth24plus", depthWriteEnabled: false, depthCompare: "less-equal" },
    });

    // Line (cube + grid + axis) pipeline
    const lineData = buildSceneLines(SCENE_HALF);
    const lineVertexBuf = device.createBuffer({
      size: lineData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      lineVertexBuf, 0,
      lineData.buffer as ArrayBuffer, lineData.byteOffset, lineData.byteLength,
    );
    const lineVertexCount = lineData.length / 6;

    const lineShader = device.createShaderModule({ code: LINE_WGSL });
    const linePipeline = device.createRenderPipeline({
      layout: renderPipelineLayout,
      vertex: {
        module: lineShader,
        entryPoint: "vs",
        buffers: [
          {
            arrayStride: 24,
            attributes: [
              { shaderLocation: 0, offset: 0,  format: "float32x3" },
              { shaderLocation: 1, offset: 12, format: "float32x3" },
            ],
          },
        ],
      },
      fragment: { module: lineShader, entryPoint: "fs", targets: [{ format }] },
      primitive: { topology: "line-list" },
      depthStencil: { format: "depth24plus", depthWriteEnabled: true, depthCompare: "less" },
    });

    // Wireframe용 index buffer (triangle indices → line indices)
    // 단순화: 같은 triangle index buffer를 line-list로 그리진 못함 (3 vertex/triangle ≠ 2 vertex/line).
    // 대신 wireframe은 triangle topology를 GPU 자체 line draw로 처리하기 위해
    // 별도 line index buffer를 빌드해 두는 게 정석이지만, 이번 데모는 단순 토글로
    // 두 pipeline (solid / line) 중 하나만 그림 (line-list로 triangle 그리면
    // 인접 vertex끼리 연결되어 살짝 다른 그림이지만 wireframe-like 효과).

    // Camera (isometric)
    const cam = {
      yaw: Math.PI / 4,
      pitch: Math.atan(1 / Math.SQRT2),
      distance: 5,
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
    let dragging = false;
    let lastX = 0, lastY = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      cam.yaw += (e.clientX - lastX) * 0.005;
      cam.pitch = Math.max(-1.4, Math.min(1.4, cam.pitch + (e.clientY - lastY) * 0.005));
      lastX = e.clientX; lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      canvas.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const minDist = SCENE_HALF * Math.sqrt(3) + 0.3;
      cam.distance = Math.max(minDist, Math.min(30, cam.distance * (1 + e.deltaY * 0.001)));
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    let frameCount = 0;
    let lastStatsTime = performance.now();
    let stepTimeSum = 0;
    const startTime = performance.now();

    const frame = () => {
      if (disposed) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor((canvas.clientWidth || 800) * dpr));
      const h = Math.max(1, Math.floor((canvas.clientHeight || 600) * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ensureDepth(w, h);

      // 1. C++ compute step
      const t = (performance.now() - startTime) / 1000;
      const t0 = performance.now();
      if (!paramsRef.current.paused) {
        module._mesh_step(t, paramsRef.current.amplitude, paramsRef.current.frequency);
      }
      const t1 = performance.now();
      stepTimeSum += t1 - t0;

      // 2. Camera + light uniform
      const aspect = w / h;
      const sceneRadius = SCENE_HALF * Math.SQRT2 * 1.3;
      const near = Math.max(0.1, cam.distance - sceneRadius);
      const far = cam.distance + sceneRadius * 3;
      const proj = mat4Perspective(Math.PI / 3, aspect, near, far);
      const ex = Math.cos(cam.pitch) * Math.sin(cam.yaw) * cam.distance;
      const ey = Math.sin(cam.pitch) * cam.distance;
      const ez = Math.cos(cam.pitch) * Math.cos(cam.yaw) * cam.distance;
      const view = mat4LookAt([ex, ey, ez], [0, 0, 0], [0, 1, 0]);
      const viewProj = mat4Mul(proj, view);

      const camData = new Float32Array(20);
      camData.set(viewProj, 0);
      // lightDir: 위에서 비스듬히
      const lx = 0.4, ly = 0.8, lz = 0.45;
      const ll = Math.hypot(lx, ly, lz);
      camData[16] = lx / ll;
      camData[17] = ly / ll;
      camData[18] = lz / ll;
      device.queue.writeBuffer(cameraBuf, 0, camData);

      // 3. Render
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

      // Scene lines (cube + grid + axis)
      pass.setPipeline(linePipeline);
      pass.setBindGroup(0, renderBindGroup);
      pass.setVertexBuffer(0, lineVertexBuf);
      pass.draw(lineVertexCount);

      // Mesh (solid or wireframe)
      const pipeline = paramsRef.current.wireframe ? meshWireframePipeline : meshPipeline;
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, renderBindGroup);
      pass.setVertexBuffer(0, vertexBuffer);
      pass.setIndexBuffer(indexBuffer, "uint32");
      pass.drawIndexed(indexCount);

      pass.end();
      device.queue.submit([encoder.finish()]);

      frameCount++;
      const now = performance.now();
      if (now - lastStatsTime >= 500) {
        const fps = Math.round((frameCount * 1000) / (now - lastStatsTime));
        const stepMs = stepTimeSum / Math.max(frameCount, 1);
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
  }, [module, device]);

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
