"use client";

import React, { useEffect, useState } from "react";

interface NBodyModule {
  _nbody_hello: () => number;
  _nbody_init_webgpu: () => number;
  _nbody_get_device_handle: () => number;
  _nbody_setup: (count: number, initialPtr: number) => number;
  _nbody_step: (dt: number, G: number, softening: number) => void;
  _nbody_copy_to_readback: () => void;
  _nbody_get_particle_buffer: () => number;
  _nbody_get_readback_buffer: () => number;
  _nbody_get_count: () => number;
  _nbody_malloc: (n: number) => number;
  _nbody_free: (p: number) => void;
  _malloc: (n: number) => number;
  _free: (p: number) => void;
  HEAPF32: Float32Array;
  HEAPU32: Uint32Array;
  HEAP8: Int8Array;
}

interface FactoryOpts {
  locateFile?: (filename: string) => string;
  preinitializedWebGPUDevice?: GPUDevice;
}
type NBodyFactory = (opts?: FactoryOpts) => Promise<NBodyModule>;

async function loadWasmFactory(jsSrc: string): Promise<NBodyFactory> {
  const res = await fetch(jsSrc);
  if (!res.ok) throw new Error(`fetch ${jsSrc} → ${res.status}`);
  const code = await res.text();
  const factory = new Function(`${code}\n;return createNBodyModule;`)();
  if (typeof factory !== "function") {
    throw new Error("createNBodyModule factory not exported");
  }
  return factory as NBodyFactory;
}

// Particle stride: vec3 pos + pad + vec3 vel + pad = 8 floats = 32 bytes
const STRIDE_FLOATS = 8;

// 무작위 sphere distribution + tangential velocity (회전 disk-ish)
function generateInitialParticles(n: number): Float32Array {
  const data = new Float32Array(n * STRIDE_FLOATS);
  for (let i = 0; i < n; i++) {
    // sphere 표면 무작위
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 0.8 + Math.random() * 0.4;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    // 접선 방향 (z축 기준 회전)
    const vx = -y * 0.4;
    const vy = x * 0.4;
    const vz = 0;

    const off = i * STRIDE_FLOATS;
    data[off + 0] = x;
    data[off + 1] = y;
    data[off + 2] = z;
    data[off + 3] = 0; // _p0
    data[off + 4] = vx;
    data[off + 5] = vy;
    data[off + 6] = vz;
    data[off + 7] = 0; // _p1
  }
  return data;
}

interface StepResult {
  label: string;
  value: string;
  ok: boolean;
}

export default function NBodyPage() {
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState<StepResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const push = (r: StepResult) => setResults((prev) => [...prev, r]);
    const N = 2048;
    const G = 0.5;
    const SOFTENING = 0.1;
    const DT = 1 / 60;
    const STEP_COUNT = 60;

    (async () => {
      try {
        setStatus("checking WebGPU…");
        if (!navigator.gpu) throw new Error("WebGPU not supported");
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("no GPU adapter");
        const device = await adapter.requestDevice();
        if (cancelled) return;
        push({ label: "GPUDevice", value: "acquired", ok: true });

        setStatus("loading wasm…");
        const factory = await loadWasmFactory("/wasm/nbody.js");
        const Module = await factory({
          locateFile: (f) => `/wasm/${f}`,
          preinitializedWebGPUDevice: device,
        });
        if (cancelled) return;

        const initRc = Module._nbody_init_webgpu();
        if (initRc !== 0) throw new Error(`nbody_init_webgpu rc=${initRc}`);
        push({ label: "nbody_init_webgpu()", value: "0 (OK)", ok: true });

        // 초기 particle 데이터 생성 + WASM heap에 복사
        setStatus(`generating ${N} particles…`);
        const initial = generateInitialParticles(N);
        const byteSize = initial.byteLength;
        const ptr = Module._nbody_malloc(byteSize);
        if (!ptr) throw new Error("nbody_malloc returned null");
        Module.HEAPF32.set(initial, ptr / 4);
        push({
          label: "WASM heap alloc",
          value: `${(byteSize / 1024).toFixed(1)} KB @ 0x${ptr.toString(16)}`,
          ok: true,
        });

        // Setup (buffer/pipeline 생성 + 데이터 업로드)
        setStatus("nbody_setup…");
        const t0 = performance.now();
        const setupRc = Module._nbody_setup(N, ptr);
        const t1 = performance.now();
        if (setupRc !== 0) throw new Error(`nbody_setup rc=${setupRc}`);
        push({
          label: "nbody_setup()",
          value: `0 (OK) in ${(t1 - t0).toFixed(2)} ms`,
          ok: true,
        });

        // Buffer handle 검증
        const particleBuf = Module._nbody_get_particle_buffer();
        const readbackBuf = Module._nbody_get_readback_buffer();
        push({
          label: "WGPUBuffer handles",
          value: `particle=0x${particleBuf.toString(16)}, readback=0x${readbackBuf.toString(16)}`,
          ok: particleBuf !== 0 && readbackBuf !== 0,
        });

        // free initial (이미 GPU에 업로드됨)
        Module._nbody_free(ptr);

        // Dispatch N step (compute pass 실행)
        setStatus(`running ${STEP_COUNT} steps…`);
        const t2 = performance.now();
        for (let i = 0; i < STEP_COUNT; i++) {
          Module._nbody_step(DT, G, SOFTENING);
        }
        // GPU에 work 제출 후 완료 대기 (queue flush). device.queue.onSubmittedWorkDone() 사용
        await device.queue.onSubmittedWorkDone();
        const t3 = performance.now();
        push({
          label: `${STEP_COUNT} steps (N=${N}, ${N * N / 1e6}M ops/step)`,
          value: `${(t3 - t2).toFixed(1)} ms total, ${((t3 - t2) / STEP_COUNT).toFixed(2)} ms/step`,
          ok: true,
        });

        setStatus("ok");
      } catch (e) {
        setError(String((e as Error)?.message ?? e));
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "2rem auto",
        padding: "0 1rem",
        color: "#0f172a",
      }}
    >
      <h1 style={{ margin: "0 0 0.5rem" }}>N-Body (C++ / WASM + WebGPU)</h1>
      <p style={{ margin: "0 0 1.5rem", color: "#64748b", fontSize: "0.95rem" }}>
        <strong>Step 3:</strong> C++ 안에서 webgpu.h로 buffer / shader module /
        compute pipeline 생성 후 N-body kernel을 dispatch. 시각화는 Step 4에서.
      </p>

      <section
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "1.25rem 1.5rem",
        }}
      >
        <div style={{ marginBottom: "0.75rem" }}>
          <strong>status:</strong>{" "}
          <code
            style={{
              padding: "0.15rem 0.5rem",
              background:
                status === "ok" ? "#dcfce7" : status === "error" ? "#fee2e2" : "#fef9c3",
              color:
                status === "ok" ? "#15803d" : status === "error" ? "#991b1b" : "#854d0e",
              borderRadius: "4px",
              fontSize: "0.85rem",
            }}
          >
            {status}
          </code>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} style={{ borderTop: i > 0 ? "1px solid #e2e8f0" : "none" }}>
                <td
                  style={{
                    padding: "0.4rem 0.5rem 0.4rem 0",
                    color: "#475569",
                    verticalAlign: "top",
                    width: "40%",
                  }}
                >
                  {r.label}
                </td>
                <td
                  style={{
                    padding: "0.4rem 0",
                    fontFamily: "ui-monospace, monospace",
                    color: r.ok ? "#15803d" : "#991b1b",
                  }}
                >
                  {r.ok ? "✓" : "✗"} {r.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {error && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.75rem",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              color: "#991b1b",
              fontSize: "0.85rem",
              fontFamily: "ui-monospace, monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            {error}
          </div>
        )}
      </section>

      <section style={{ marginTop: "2rem", color: "#64748b", fontSize: "0.85rem" }}>
        <p style={{ margin: "0 0 0.5rem" }}>
          <strong>다음 단계:</strong>
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.7 }}>
          <li>Step 4: GPU buffer를 JS render pipeline과 share → 실제 particle 시각화</li>
          <li>Step 5: UI polish (FPS, particle count slider, init patterns)</li>
        </ul>
      </section>
    </main>
  );
}
