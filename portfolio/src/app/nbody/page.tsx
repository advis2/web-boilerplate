"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const NBodyRenderCanvas = dynamic(() => import("./NBodyRenderCanvas"), { ssr: false });

interface NBodyModule {
  _nbody_hello: () => number;
  _nbody_init_webgpu: () => number;
  _nbody_setup: (count: number, initialPtr: number) => number;
  _nbody_step: (dt: number, G: number, softening: number) => void;
  _nbody_get_particle_buffer: () => number;
  _nbody_malloc: (n: number) => number;
  _nbody_free: (p: number) => void;
  HEAPF32: Float32Array;
  WebGPU: {
    mgrBuffer: { get: (handle: number) => GPUBuffer };
  };
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

const STRIDE_FLOATS = 8;

function generateInitialParticles(n: number): Float32Array {
  const data = new Float32Array(n * STRIDE_FLOATS);
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 0.8 + Math.random() * 0.5;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    const vx = -y * 0.5;
    const vy = x * 0.5;
    const off = i * STRIDE_FLOATS;
    data[off + 0] = x;
    data[off + 1] = y;
    data[off + 2] = z;
    data[off + 4] = vx;
    data[off + 5] = vy;
    data[off + 6] = 0;
  }
  return data;
}

const N = 2048;
const DT = 1 / 120; // 더 안정적인 적분
const G_DEFAULT = 0.3;
const SOFTENING_DEFAULT = 0.15;

interface Ready {
  module: NBodyModule;
  device: GPUDevice;
}

export default function NBodyPage() {
  const [status, setStatus] = useState("loading…");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<Ready | null>(null);
  const [stats, setStats] = useState({ fps: 0, stepMs: 0 });
  const [G, setG] = useState(G_DEFAULT);
  const [softening, setSoftening] = useState(SOFTENING_DEFAULT);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.gpu) throw new Error("WebGPU not supported");
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("no GPU adapter");
        const device = await adapter.requestDevice();
        if (cancelled) return;

        setStatus("loading wasm…");
        const factory = await loadWasmFactory("/wasm/nbody.js");
        const Module = await factory({
          locateFile: (f) => `/wasm/${f}`,
          preinitializedWebGPUDevice: device,
        });
        if (cancelled) return;

        if (Module._nbody_init_webgpu() !== 0) throw new Error("nbody_init_webgpu failed");

        setStatus(`generating ${N} particles…`);
        const initial = generateInitialParticles(N);
        const ptr = Module._nbody_malloc(initial.byteLength);
        if (!ptr) throw new Error("malloc failed");
        Module.HEAPF32.set(initial, ptr / 4);

        setStatus("nbody_setup…");
        const rc = Module._nbody_setup(N, ptr);
        Module._nbody_free(ptr);
        if (rc !== 0) throw new Error(`nbody_setup rc=${rc}`);

        if (!Module.WebGPU?.mgrBuffer) {
          throw new Error("Module.WebGPU.mgrBuffer not available — post.js build issue");
        }

        setReady({ module: Module, device });
        setStatus("running");
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 90px)",
        margin: "-20px",
        background: "#0b1220",
        color: "#e2e8f0",
      }}
    >
      <Header
        status={status}
        stats={stats}
        G={G}
        setG={setG}
        softening={softening}
        setSoftening={setSoftening}
        running={running}
        setRunning={setRunning}
      />

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {ready && running ? (
          <NBodyRenderCanvas
            module={ready.module}
            device={ready.device}
            particleCount={N}
            dt={DT}
            G={G}
            softening={softening}
            onStats={setStats}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: "0.95rem",
            }}
          >
            {error ? (
              <div
                style={{
                  maxWidth: 500,
                  padding: "1rem",
                  background: "#3f1d2e",
                  border: "1px solid #7f1d1d",
                  borderRadius: "8px",
                  color: "#fda4af",
                  fontFamily: "ui-monospace, monospace",
                  fontSize: "0.85rem",
                  whiteSpace: "pre-wrap",
                }}
              >
                ✗ {error}
              </div>
            ) : (
              `${status}`
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Header({
  status,
  stats,
  G,
  setG,
  softening,
  setSoftening,
  running,
  setRunning,
}: {
  status: string;
  stats: { fps: number; stepMs: number };
  G: number;
  setG: (v: number) => void;
  softening: number;
  setSoftening: (v: number) => void;
  running: boolean;
  setRunning: (b: boolean) => void;
}) {
  return (
    <header
      style={{
        padding: "0.75rem 1.25rem",
        borderBottom: "1px solid #1e293b",
        background: "#0f172a",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "#f1f5f9" }}>
          N-Body (C++/WASM compute + WebGPU render)
        </h1>
        <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>
          {N.toLocaleString()} particles · all-pairs O(N²) gravity in C++ via webgpu.h
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <Slider label="G" value={G} min={0} max={1} step={0.01} onChange={setG} />
        <Slider label="softening" value={softening} min={0.05} max={0.5} step={0.01} onChange={setSoftening} />

        <button
          onClick={() => setRunning(!running)}
          style={{
            padding: "0.4rem 0.85rem",
            background: running ? "#7f1d1d" : "#0f766e",
            color: "#fff",
            border: "1px solid #334155",
            borderRadius: "6px",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          {running ? "⏸ Pause" : "▶ Run"}
        </button>
      </div>

      <div
        style={{
          marginLeft: "auto",
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.78rem",
          color: "#94a3b8",
        }}
      >
        {status} · {stats.fps} fps · cpp step: {stats.stepMs.toFixed(2)} ms
      </div>
    </header>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
      <span style={{ color: "#cbd5e1", minWidth: 70 }}>
        {label}: <code style={{ color: "#f1f5f9" }}>{value.toFixed(2)}</code>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: 100 }}
      />
    </label>
  );
}
