"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MeshCanvas = dynamic(() => import("./MeshCanvas"), { ssr: false });

interface MeshModule {
  _mesh_init_webgpu: () => number;
  _mesh_setup: (kind: number, seg1: number, seg2: number) => number;
  _mesh_step: (time: number, amplitude: number, frequency: number) => void;
  _mesh_get_vertex_buffer: () => number;
  _mesh_get_index_buffer: () => number;
  _mesh_get_vertex_count: () => number;
  _mesh_get_index_count: () => number;
  WebGPU: {
    mgrBuffer: { get: (handle: number) => GPUBuffer };
  };
}

interface FactoryOpts {
  locateFile?: (filename: string) => string;
  preinitializedWebGPUDevice?: GPUDevice;
}
type MeshFactory = (opts?: FactoryOpts) => Promise<MeshModule>;

async function loadWasmFactory(jsSrc: string): Promise<MeshFactory> {
  const res = await fetch(jsSrc);
  if (!res.ok) throw new Error(`fetch ${jsSrc} → ${res.status}`);
  const code = await res.text();
  const factory = new Function(`${code}\n;return createMeshModule;`)();
  if (typeof factory !== "function") {
    throw new Error("createMeshModule factory not exported");
  }
  return factory as MeshFactory;
}

interface MeshKind {
  name: string;
  kind: 0 | 1; // 0 sphere, 1 torus
  seg1: number;
  seg2: number;
  defaultAmplitude: number;
  defaultFrequency: number;
}

const MESH_KINDS: MeshKind[] = [
  { name: "Sphere (64×128)",  kind: 0, seg1: 64,  seg2: 128, defaultAmplitude: 0.15, defaultFrequency: 4 },
  { name: "Sphere (128×256)", kind: 0, seg1: 128, seg2: 256, defaultAmplitude: 0.15, defaultFrequency: 4 },
  { name: "Torus (64×32)",    kind: 1, seg1: 64,  seg2: 32,  defaultAmplitude: 0.1,  defaultFrequency: 3 },
  { name: "Torus (128×64)",   kind: 1, seg1: 128, seg2: 64,  defaultAmplitude: 0.1,  defaultFrequency: 3 },
];

interface Ready {
  module: MeshModule;
  device: GPUDevice;
  vertexCount: number;
  indexCount: number;
}

export default function MeshPage() {
  const [status, setStatus] = useState("loading…");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<Ready | null>(null);
  const [stats, setStats] = useState({ fps: 0, stepMs: 0 });
  const [meshIdx, setMeshIdx] = useState(0);
  const [amplitude, setAmplitude] = useState(MESH_KINDS[0].defaultAmplitude);
  const [frequency, setFrequency] = useState(MESH_KINDS[0].defaultFrequency);
  const [wireframe, setWireframe] = useState(false);
  const [paused, setPaused] = useState(false);
  const [resetSerial, setResetSerial] = useState(0);

  const setupMesh = useCallback((mod: MeshModule, idx: number) => {
    const m = MESH_KINDS[idx];
    const rc = mod._mesh_setup(m.kind, m.seg1, m.seg2);
    if (rc !== 0) throw new Error(`mesh_setup rc=${rc}`);
    return {
      vertexCount: mod._mesh_get_vertex_count(),
      indexCount: mod._mesh_get_index_count(),
    };
  }, []);

  const handleMeshChange = (idx: number) => {
    setMeshIdx(idx);
    setAmplitude(MESH_KINDS[idx].defaultAmplitude);
    setFrequency(MESH_KINDS[idx].defaultFrequency);
    if (ready) {
      try {
        const { vertexCount, indexCount } = setupMesh(ready.module, idx);
        setReady({ ...ready, vertexCount, indexCount });
        setResetSerial((s) => s + 1);
      } catch (e) {
        setError(String((e as Error)?.message ?? e));
      }
    }
  };

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
        const factory = await loadWasmFactory("/wasm/mesh.js");
        const Module = await factory({
          locateFile: (f) => `/wasm/${f}`,
          preinitializedWebGPUDevice: device,
        });
        if (cancelled) return;

        if (Module._mesh_init_webgpu() !== 0) throw new Error("mesh_init_webgpu failed");
        if (!Module.WebGPU?.mgrBuffer) {
          throw new Error("Module.WebGPU.mgrBuffer not available — post.js build issue");
        }

        setStatus("generating mesh…");
        const { vertexCount, indexCount } = setupMesh(Module, meshIdx);

        setReady({ module: Module, device, vertexCount, indexCount });
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
        ready={ready}
        meshIdx={meshIdx}
        onMeshChange={handleMeshChange}
        amplitude={amplitude}
        setAmplitude={setAmplitude}
        frequency={frequency}
        setFrequency={setFrequency}
        wireframe={wireframe}
        setWireframe={setWireframe}
        paused={paused}
        setPaused={setPaused}
      />

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {ready ? (
          <MeshCanvas
            key={resetSerial}
            module={ready.module}
            device={ready.device}
            amplitude={amplitude}
            frequency={frequency}
            wireframe={wireframe}
            paused={paused}
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
              status
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Header(props: {
  status: string;
  stats: { fps: number; stepMs: number };
  ready: Ready | null;
  meshIdx: number;
  onMeshChange: (idx: number) => void;
  amplitude: number;
  setAmplitude: (v: number) => void;
  frequency: number;
  setFrequency: (v: number) => void;
  wireframe: boolean;
  setWireframe: (b: boolean) => void;
  paused: boolean;
  setPaused: (b: boolean) => void;
}) {
  return (
    <header
      style={{
        padding: "0.75rem 1.25rem",
        borderBottom: "1px solid #1e293b",
        background: "#0f172a",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600, color: "#f1f5f9" }}>
          Procedural Mesh · C++/WASM + WebGPU compute
        </h1>
        <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>
          C++가 mesh 생성·GPU upload, compute kernel이 매 frame vertex 변형, JS render가 zero-copy 시각화
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <Select
          label="Mesh"
          value={props.meshIdx}
          options={MESH_KINDS.map((m, i) => ({ value: i, label: m.name }))}
          onChange={props.onMeshChange}
        />
        <Slider label="amp"  value={props.amplitude} min={0}    max={0.5} step={0.01} onChange={props.setAmplitude} />
        <Slider label="freq" value={props.frequency} min={0.5}  max={10}  step={0.1}  onChange={props.setFrequency} />

        <Toggle label="wire" value={props.wireframe} onChange={props.setWireframe} />

        <button
          onClick={() => props.setPaused(!props.paused)}
          style={{
            padding: "0.3rem 0.65rem",
            background: props.paused ? "#0f766e" : "#7f1d1d",
            color: "#fff",
            border: "1px solid #334155",
            borderRadius: "4px",
            fontSize: "0.85rem",
            cursor: "pointer",
            minWidth: 32,
          }}
        >
          {props.paused ? "▶" : "⏸"}
        </button>
      </div>

      <div
        style={{
          marginLeft: "auto",
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.75rem",
          color: "#94a3b8",
          textAlign: "right",
          lineHeight: 1.5,
        }}
      >
        <div>{props.stats.fps} fps · cpp step: {props.stats.stepMs.toFixed(2)} ms</div>
        <div style={{ color: "#64748b" }}>
          {props.ready
            ? `${props.ready.vertexCount.toLocaleString()} vertices · ${(props.ready.indexCount / 3).toLocaleString()} triangles`
            : props.status}
        </div>
      </div>
    </header>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: { value: number; label: string }[];
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem" }}>
      <span style={{ color: "#cbd5e1" }}>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{
          background: "#1e293b",
          color: "#e2e8f0",
          border: "1px solid #334155",
          borderRadius: "4px",
          padding: "0.25rem 0.4rem",
          fontSize: "0.78rem",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
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
    <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.78rem" }}>
      <span style={{ color: "#cbd5e1", minWidth: 50 }}>
        {label}: <code style={{ color: "#f1f5f9" }}>{value.toFixed(2)}</code>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: 80 }}
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        padding: "0.3rem 0.65rem",
        background: value ? "#0f766e" : "#1e293b",
        color: value ? "#fff" : "#cbd5e1",
        border: "1px solid #334155",
        borderRadius: "4px",
        fontSize: "0.78rem",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
