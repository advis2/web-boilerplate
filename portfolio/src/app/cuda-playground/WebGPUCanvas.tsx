"use client";

import React, { useEffect, useRef } from "react";
import type { CameraInit } from "./presets";

const PARTICLE_COUNT = 16384;
const WORKGROUP_SIZE = 64;
const SCENE_HALF = 3; // wireframe cube / ground grid 반경

const LINE_WGSL = `
struct Camera {
  viewProj  : mat4x4<f32>,
  pointSize : f32,
  _pad0     : f32,
  _pad1     : f32,
  _pad2     : f32,
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

// 큐브 12 edges (24 vertices) + ground grid (XZ at y=-SCENE_HALF)
function buildSceneLines(half: number): Float32Array {
  const vs: number[] = [];
  const pushLine = (
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cr: number, cg: number, cb: number,
  ) => {
    vs.push(ax, ay, az, cr, cg, cb);
    vs.push(bx, by, bz, cr, cg, cb);
  };

  // X axis red, Y axis green, Z axis blue (원점에서 짧게)
  pushLine(0, 0, 0, half * 0.4, 0, 0, 0.9, 0.25, 0.25);
  pushLine(0, 0, 0, 0, half * 0.4, 0, 0.25, 0.9, 0.25);
  pushLine(0, 0, 0, 0, 0, half * 0.4, 0.25, 0.4, 1.0);

  // Wireframe cube [-half, half]^3 (회색)
  const c = 0.32;
  // bottom 4
  pushLine(-half, -half, -half,  half, -half, -half, c, c, c);
  pushLine( half, -half, -half,  half, -half,  half, c, c, c);
  pushLine( half, -half,  half, -half, -half,  half, c, c, c);
  pushLine(-half, -half,  half, -half, -half, -half, c, c, c);
  // top 4
  pushLine(-half,  half, -half,  half,  half, -half, c, c, c);
  pushLine( half,  half, -half,  half,  half,  half, c, c, c);
  pushLine( half,  half,  half, -half,  half,  half, c, c, c);
  pushLine(-half,  half,  half, -half,  half, -half, c, c, c);
  // verticals 4
  pushLine(-half, -half, -half, -half,  half, -half, c, c, c);
  pushLine( half, -half, -half,  half,  half, -half, c, c, c);
  pushLine( half, -half,  half,  half,  half,  half, c, c, c);
  pushLine(-half, -half,  half, -half,  half,  half, c, c, c);

  // Ground grid at y = -half (어두운 회색)
  const g = 0.18;
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = -half + (2 * half * i) / steps;
    pushLine(-half, -half, t,  half, -half, t,  g, g, g);
    pushLine(t, -half, -half,  t, -half,  half,  g, g, g);
  }

  const arr = new Float32Array(vs.length);
  arr.set(vs);
  return arr;
}

const RENDER_WGSL = `
struct Particle {
  position : vec3<f32>,
  _p0      : f32,
  velocity : vec3<f32>,
  _p1      : f32,
};

struct Camera {
  viewProj  : mat4x4<f32>,
  pointSize : f32,
  _pad0     : f32,
  _pad1     : f32,
  _pad2     : f32,
};

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<uniform>        cam       : Camera;

struct VOut {
  @builtin(position) pos   : vec4<f32>,
  @location(0)       color : vec3<f32>,
  @location(1)       uv    : vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> VOut {
  var quad = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0),
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0,  1.0), vec2<f32>(-1.0,  1.0)
  );
  let local = quad[vi];

  let p   = particles[ii];
  var clip = cam.viewProj * vec4<f32>(p.position, 1.0);
  clip = vec4<f32>(
    clip.x + local.x * cam.pointSize * clip.w,
    clip.y + local.y * cam.pointSize * clip.w,
    clip.z,
    clip.w
  );

  let speed = length(p.velocity);
  let col = mix(vec3<f32>(0.25, 0.62, 1.0), vec3<f32>(1.0, 0.5, 0.25), clamp(speed * 0.4, 0.0, 1.0));

  var out : VOut;
  out.pos   = clip;
  out.color = col;
  out.uv    = local;
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

// gl-matrix 없이 인라인 mat4 helper
function mat4Mul(a: Float32Array, b: Float32Array): Float32Array {
  const r = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      r[i * 4 + j] =
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j];
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

function mat4LookAt(eye: [number, number, number], center: [number, number, number], up: [number, number, number]): Float32Array {
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

interface Props {
  shaderCode: string;
  cameraInit: CameraInit;
  resetSerial: number;
  onError: (msg: string | null) => void;
  onUnsupported: () => void;
}

export default function WebGPUCanvas({
  shaderCode,
  cameraInit,
  resetSerial,
  onError,
  onUnsupported,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const shaderCodeRef = useRef(shaderCode);
  const cameraInitRef = useRef(cameraInit);
  cameraInitRef.current = cameraInit;
  const stateRef = useRef<{
    device?: GPUDevice;
    context?: GPUCanvasContext;
    format?: GPUTextureFormat;
    particleBuf?: GPUBuffer;
    uniformBuf?: GPUBuffer;
    cameraBuf?: GPUBuffer;
    computeBGL?: GPUBindGroupLayout;
    renderBGL?: GPUBindGroupLayout;
    computePipeline?: GPUComputePipeline;
    computeBindGroup?: GPUBindGroup;
    renderPipeline?: GPURenderPipeline;
    renderBindGroup?: GPUBindGroup;
    linePipeline?: GPURenderPipeline;
    lineBindGroup?: GPUBindGroup;
    lineVertexBuf?: GPUBuffer;
    lineVertexCount?: number;
    depthTex?: GPUTexture;
    rafId?: number;
    startTime: number;
    lastTime: number;
    yaw: number;
    pitch: number;
    distance: number;
    pointSize: number;
    resetTime: boolean;
  }>({
    startTime: 0,
    lastTime: 0,
    yaw: cameraInit.yaw,
    pitch: cameraInit.pitch,
    distance: cameraInit.distance,
    pointSize: cameraInit.pointSize,
    resetTime: false,
  });

  // 사용자 코드 변경을 ref로 추적 (re-mount 없이)
  useEffect(() => {
    shaderCodeRef.current = shaderCode;
    const s = stateRef.current;
    if (s.device && s.computeBGL) {
      recompileCompute(s, shaderCode, onError);
    }
  }, [shaderCode, onError]);

  // preset 변경 또는 Reset View → 카메라 init 값으로 복원
  useEffect(() => {
    const s = stateRef.current;
    s.yaw = cameraInit.yaw;
    s.pitch = cameraInit.pitch;
    s.distance = cameraInit.distance;
  }, [resetSerial, cameraInit.yaw, cameraInit.pitch, cameraInit.distance]);

  useEffect(() => {
    let disposed = false;

    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      updateStatus(statusRef.current, "init", "requesting adapter…");
      if (!navigator.gpu) {
        onUnsupported();
        return;
      }

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        onUnsupported();
        return;
      }
      updateStatus(statusRef.current, "init", "requesting device…");
      const device = await adapter.requestDevice();
      if (disposed) return;

      device.lost.then((info) => {
        if (!disposed) onError(`GPU device lost: ${info.message}`);
      });
      device.addEventListener("uncapturederror", (ev) => {
        const e = ev as GPUUncapturedErrorEvent;
        onError(`uncaptured: ${e.error.message}`);
      });

      const context = canvas.getContext("webgpu") as GPUCanvasContext;
      if (!context) {
        onError("canvas.getContext('webgpu') returned null");
        return;
      }
      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: "opaque" });
      updateStatus(statusRef.current, "init", "device ok");

      // Buffers
      const particleData = new Float32Array(PARTICLE_COUNT * 8);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const side = 128;
        particleData[i * 8 + 0] = (i % side) * 0.04 - side * 0.04 * 0.5;
        particleData[i * 8 + 1] = 0;
        particleData[i * 8 + 2] = Math.floor(i / side) * 0.04 - side * 0.04 * 0.5;
      }

      const particleBuf = device.createBuffer({
        size: particleData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(particleBuf, 0, particleData);

      const uniformBuf = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      const cameraBuf = device.createBuffer({
        size: 80,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      // Explicit bind group layouts
      const computeBGL = device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
          { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
        ],
      });

      const renderBGL = device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "read-only-storage" } },
          { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } },
        ],
      });

      const computeBindGroup = device.createBindGroup({
        layout: computeBGL,
        entries: [
          { binding: 0, resource: { buffer: particleBuf } },
          { binding: 1, resource: { buffer: uniformBuf } },
        ],
      });

      const renderBindGroup = device.createBindGroup({
        layout: renderBGL,
        entries: [
          { binding: 0, resource: { buffer: particleBuf } },
          { binding: 1, resource: { buffer: cameraBuf } },
        ],
      });

      // Render pipeline (고정)
      const renderModule = device.createShaderModule({ code: RENDER_WGSL });
      const renderPipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [renderBGL] });
      const renderPipeline = device.createRenderPipeline({
        layout: renderPipelineLayout,
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

      // Line (wireframe cube + ground grid + axis) pipeline
      const lineData = buildSceneLines(SCENE_HALF);
      const lineVertexBuf = device.createBuffer({
        size: lineData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
      device.queue.writeBuffer(
        lineVertexBuf,
        0,
        lineData.buffer as ArrayBuffer,
        lineData.byteOffset,
        lineData.byteLength,
      );

      const lineBGL = device.createBindGroupLayout({
        entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: "uniform" } }],
      });
      const lineBindGroup = device.createBindGroup({
        layout: lineBGL,
        entries: [{ binding: 0, resource: { buffer: cameraBuf } }],
      });
      const lineModule = device.createShaderModule({ code: LINE_WGSL });
      const lineLayout = device.createPipelineLayout({ bindGroupLayouts: [lineBGL] });
      const linePipeline = device.createRenderPipeline({
        layout: lineLayout,
        vertex: {
          module: lineModule,
          entryPoint: "vs",
          buffers: [
            {
              arrayStride: 24, // vec3 pos + vec3 color
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 12, format: "float32x3" },
              ],
            },
          ],
        },
        fragment: { module: lineModule, entryPoint: "fs", targets: [{ format }] },
        primitive: { topology: "line-list" },
        depthStencil: { format: "depth24plus", depthWriteEnabled: true, depthCompare: "less" },
      });

      const s = stateRef.current;
      s.device = device;
      s.context = context;
      s.format = format;
      s.particleBuf = particleBuf;
      s.uniformBuf = uniformBuf;
      s.cameraBuf = cameraBuf;
      s.computeBGL = computeBGL;
      s.renderBGL = renderBGL;
      s.computeBindGroup = computeBindGroup;
      s.renderPipeline = renderPipeline;
      s.renderBindGroup = renderBindGroup;
      s.linePipeline = linePipeline;
      s.lineBindGroup = lineBindGroup;
      s.lineVertexBuf = lineVertexBuf;
      s.lineVertexCount = lineData.length / 6;
      s.startTime = performance.now();
      s.lastTime = s.startTime;

      resizeIfNeeded(s, canvas);
      recompileCompute(s, shaderCodeRef.current, onError);

      let frameCount = 0;
      let fpsTimer = performance.now();
      const frame = () => {
        if (disposed) return;
        s.pointSize = cameraInitRef.current.pointSize;
        renderFrame(s, canvas);
        frameCount++;
        const now = performance.now();
        if (now - fpsTimer >= 500) {
          const fps = Math.round((frameCount * 1000) / (now - fpsTimer));
          updateStatus(statusRef.current, "fps", String(fps));
          updateStatus(statusRef.current, "size", `${canvas.width}×${canvas.height}`);
          frameCount = 0;
          fpsTimer = now;
        }
        s.rafId = requestAnimationFrame(frame);
      };
      s.rafId = requestAnimationFrame(frame);
    })().catch((err) => {
      console.error(err);
      onError(String(err?.message ?? err));
    });

    // ResizeObserver로 layout 변경 즉시 대응 (Monaco lazy load 등 layout shift 케이스)
    const canvasEl = canvasRef.current;
    let ro: ResizeObserver | null = null;
    if (canvasEl && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => resizeIfNeeded(stateRef.current, canvasEl));
      ro.observe(canvasEl);
    }

    // 마우스 인터랙션
    const canvas = canvasRef.current;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas?.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const s = stateRef.current;
      s.yaw += dx * 0.005;
      s.pitch = Math.max(-1.4, Math.min(1.4, s.pitch + dy * 0.005));
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      canvas?.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = stateRef.current;
      s.distance = Math.max(2, Math.min(30, s.distance * (1 + e.deltaY * 0.001)));
    };
    canvas?.addEventListener("pointerdown", onDown);
    canvas?.addEventListener("pointermove", onMove);
    canvas?.addEventListener("pointerup", onUp);
    canvas?.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      disposed = true;
      const s = stateRef.current;
      if (s.rafId) cancelAnimationFrame(s.rafId);
      ro?.disconnect();
      canvas?.removeEventListener("pointerdown", onDown);
      canvas?.removeEventListener("pointermove", onMove);
      canvas?.removeEventListener("pointerup", onUp);
      canvas?.removeEventListener("wheel", onWheel);
    };
  }, [onError, onUnsupported]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
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
      <div
        ref={statusRef}
        style={{
          position: "absolute",
          top: "0.5rem",
          left: "0.5rem",
          padding: "0.3rem 0.55rem",
          background: "rgba(15, 23, 42, 0.85)",
          border: "1px solid #1e293b",
          borderRadius: "6px",
          color: "#94a3b8",
          fontSize: "0.7rem",
          fontFamily: "ui-monospace, monospace",
          pointerEvents: "none",
        }}
      >
        init: waiting…
      </div>
    </div>
  );
}

async function recompileCompute(
  s: {
    device?: GPUDevice;
    computeBGL?: GPUBindGroupLayout;
    computePipeline?: GPUComputePipeline;
    resetTime: boolean;
  },
  code: string,
  onError: (msg: string | null) => void,
) {
  const device = s.device;
  const computeBGL = s.computeBGL;
  if (!device || !computeBGL) return;

  try {
    // pushErrorScope로 비동기 컴파일 에러 캐치
    device.pushErrorScope("validation");
    const module = device.createShaderModule({ code });
    const info = await module.getCompilationInfo();
    const errors = info.messages.filter((m) => m.type === "error");
    if (errors.length > 0) {
      const msg = errors
        .map((e) => `line ${e.lineNum}:${e.linePos}  ${e.message}`)
        .join("\n");
      onError(msg);
      device.popErrorScope().catch((e) => console.warn("popErrorScope:", e));
      return;
    }

    const layout = device.createPipelineLayout({ bindGroupLayouts: [computeBGL] });
    const pipeline = device.createComputePipeline({
      layout,
      compute: { module, entryPoint: "main" },
    });

    const validationError = await device.popErrorScope();
    if (validationError) {
      onError(validationError.message);
      return;
    }

    s.computePipeline = pipeline;
    s.resetTime = true;
    onError(null);
  } catch (err) {
    onError(String((err as Error)?.message ?? err));
  }
}

function resizeIfNeeded(
  s: {
    device?: GPUDevice;
    depthTex?: GPUTexture;
    format?: GPUTextureFormat;
  },
  canvas: HTMLCanvasElement,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // clientWidth가 0인 경우 getBoundingClientRect로 한 번 더 확인
  const cssW = canvas.clientWidth || canvas.getBoundingClientRect().width || 800;
  const cssH = canvas.clientHeight || canvas.getBoundingClientRect().height || 600;
  const w = Math.max(1, Math.floor(cssW * dpr));
  const h = Math.max(1, Math.floor(cssH * dpr));
  if (canvas.width === w && canvas.height === h && s.depthTex) return;
  canvas.width = w;
  canvas.height = h;
  if (!s.device) return;
  s.depthTex?.destroy();
  s.depthTex = s.device.createTexture({
    size: [w, h],
    format: "depth24plus",
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  });
}

function updateStatus(el: HTMLDivElement | null, key: string, value: string) {
  if (!el) return;
  const map = (el.dataset.status ? JSON.parse(el.dataset.status) : {}) as Record<string, string>;
  map[key] = value;
  el.dataset.status = JSON.stringify(map);
  el.textContent = Object.entries(map)
    .map(([k, v]) => `${k}: ${v}`)
    .join("  ·  ");
}

function renderFrame(
  s: {
    device?: GPUDevice;
    context?: GPUCanvasContext;
    particleBuf?: GPUBuffer;
    uniformBuf?: GPUBuffer;
    cameraBuf?: GPUBuffer;
    computePipeline?: GPUComputePipeline;
    computeBindGroup?: GPUBindGroup;
    renderPipeline?: GPURenderPipeline;
    renderBindGroup?: GPUBindGroup;
    linePipeline?: GPURenderPipeline;
    lineBindGroup?: GPUBindGroup;
    lineVertexBuf?: GPUBuffer;
    lineVertexCount?: number;
    depthTex?: GPUTexture;
    startTime: number;
    lastTime: number;
    yaw: number;
    pitch: number;
    distance: number;
    pointSize: number;
    resetTime: boolean;
  },
  canvas: HTMLCanvasElement,
) {
  const { device, context, uniformBuf, cameraBuf, depthTex } = s;
  if (!device || !context || !uniformBuf || !cameraBuf || !depthTex) return;

  resizeIfNeeded(s, canvas);

  const now = performance.now();
  if (s.resetTime) {
    s.startTime = now;
    s.lastTime = now;
    s.resetTime = false;
  }
  const t = (now - s.startTime) / 1000;
  const dt = Math.min(0.05, (now - s.lastTime) / 1000);
  s.lastTime = now;

  // Uniforms
  const u = new ArrayBuffer(16);
  new Float32Array(u, 0, 1)[0] = t;
  new Float32Array(u, 4, 1)[0] = dt;
  new Uint32Array(u, 8, 1)[0] = PARTICLE_COUNT;
  device.queue.writeBuffer(uniformBuf, 0, u);

  // Camera
  const aspect = canvas.width / canvas.height;
  const proj = mat4Perspective(Math.PI / 3, aspect, 0.1, 100);
  const ex = Math.cos(s.pitch) * Math.sin(s.yaw) * s.distance;
  const ey = Math.sin(s.pitch) * s.distance;
  const ez = Math.cos(s.pitch) * Math.cos(s.yaw) * s.distance;
  const view = mat4LookAt([ex, ey, ez], [0, 0, 0], [0, 1, 0]);
  const viewProj = mat4Mul(proj, view);

  const camData = new Float32Array(20);
  camData.set(viewProj, 0);
  camData[16] = s.pointSize;
  device.queue.writeBuffer(cameraBuf, 0, camData);

  const encoder = device.createCommandEncoder();

  // Compute pass
  if (s.computePipeline && s.computeBindGroup) {
    const pass = encoder.beginComputePass();
    pass.setPipeline(s.computePipeline);
    pass.setBindGroup(0, s.computeBindGroup);
    pass.dispatchWorkgroups(Math.ceil(PARTICLE_COUNT / WORKGROUP_SIZE));
    pass.end();
  }

  // Render pass
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
      view: depthTex.createView(),
      depthClearValue: 1,
      depthLoadOp: "clear",
      depthStoreOp: "store",
    },
  });
  // Lines (wireframe cube + ground grid + axis) — particle 전에 그려서 가려질 수도 있게
  if (s.linePipeline && s.lineBindGroup && s.lineVertexBuf && s.lineVertexCount) {
    pass.setPipeline(s.linePipeline);
    pass.setBindGroup(0, s.lineBindGroup);
    pass.setVertexBuffer(0, s.lineVertexBuf);
    pass.draw(s.lineVertexCount);
  }
  if (s.renderPipeline && s.renderBindGroup) {
    pass.setPipeline(s.renderPipeline);
    pass.setBindGroup(0, s.renderBindGroup);
    pass.draw(6, PARTICLE_COUNT);
  }
  pass.end();

  device.queue.submit([encoder.finish()]);
}
