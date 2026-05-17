"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { patterns, PARTICLE_COUNTS } from "./patterns";

const NBodyRenderCanvas = dynamic(() => import("./NBodyRenderCanvas"), { ssr: false });

interface NBodyModule {
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

const DT = 1 / 240;

interface Ready {
  module: NBodyModule;
  device: GPUDevice;
}

export default function NBodyPage() {
  const [status, setStatus] = useState("loading…");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<Ready | null>(null);
  const [stats, setStats] = useState({ fps: 0, stepMs: 0 });

  const [patternIdx, setPatternIdx] = useState(0);
  const [count, setCount] = useState<number>(2048);
  const [G, setG] = useState(patterns[0].defaultG);
  const [softening, setSoftening] = useState(patterns[0].defaultSoftening);
  const [running, setRunning] = useState(true);
  const [resetSerial, setResetSerial] = useState(0);

  const reuploadParticles = useCallback(
    (mod: NBodyModule, patternIndex: number, n: number) => {
      const initial = patterns[patternIndex].generate(n);
      const ptr = mod._nbody_malloc(initial.byteLength);
      if (!ptr) throw new Error("malloc failed");
      mod.HEAPF32.set(initial, ptr / 4);
      const rc = mod._nbody_setup(n, ptr);
      mod._nbody_free(ptr);
      if (rc !== 0) throw new Error(`nbody_setup rc=${rc}`);
    },
    [],
  );

  const handlePatternChange = (idx: number) => {
    setPatternIdx(idx);
    setG(patterns[idx].defaultG);
    setSoftening(patterns[idx].defaultSoftening);
    if (ready) {
      try {
        reuploadParticles(ready.module, idx, count);
        setResetSerial((s) => s + 1);
      } catch (e) {
        setError(String((e as Error)?.message ?? e));
      }
    }
  };

  const handleCountChange = (n: number) => {
    setCount(n);
    if (ready) {
      try {
        reuploadParticles(ready.module, patternIdx, n);
        setResetSerial((s) => s + 1);
      } catch (e) {
        setError(String((e as Error)?.message ?? e));
      }
    }
  };

  const handleReset = () => {
    if (!ready) return;
    try {
      reuploadParticles(ready.module, patternIdx, count);
      setResetSerial((s) => s + 1);
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
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
        const factory = await loadWasmFactory("/wasm/nbody.js");
        const Module = await factory({
          locateFile: (f) => `/wasm/${f}`,
          preinitializedWebGPUDevice: device,
        });
        if (cancelled) return;

        if (Module._nbody_init_webgpu() !== 0) throw new Error("nbody_init_webgpu failed");
        if (!Module.WebGPU?.mgrBuffer) {
          throw new Error("Module.WebGPU.mgrBuffer not available — post.js build issue");
        }

        setStatus(`generating ${count} particles…`);
        reuploadParticles(Module, patternIdx, count);
        if (cancelled) return;

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
    // 첫 마운트에만 — 이후 변경은 handler들이 처리
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
        patternIdx={patternIdx}
        onPatternChange={handlePatternChange}
        count={count}
        onCountChange={handleCountChange}
        G={G}
        setG={setG}
        softening={softening}
        setSoftening={setSoftening}
        running={running}
        setRunning={setRunning}
        onReset={handleReset}
        resetEnabled={ready !== null}
      />

      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        {ready && running ? (
          <NBodyRenderCanvas
            key={resetSerial}
            module={ready.module}
            device={ready.device}
            particleCount={count}
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

function Header(props: {
  status: string;
  stats: { fps: number; stepMs: number };
  patternIdx: number;
  onPatternChange: (idx: number) => void;
  count: number;
  onCountChange: (n: number) => void;
  G: number;
  setG: (v: number) => void;
  softening: number;
  setSoftening: (v: number) => void;
  running: boolean;
  setRunning: (b: boolean) => void;
  onReset: () => void;
  resetEnabled: boolean;
}) {
  const p = patterns[props.patternIdx];
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
          N-Body · C++/WASM compute orchestration + WebGPU
        </h1>
        <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#94a3b8" }}>
          {p.description} · O(N²) gravity, kernel dispatched from C++ via webgpu.h
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label style={selectLabelStyle}>
          <span style={{ color: "#cbd5e1" }}>Pattern:</span>
          <select
            value={props.patternIdx}
            onChange={(e) => props.onPatternChange(parseInt(e.target.value, 10))}
            style={selectStyle}
          >
            {patterns.map((p, i) => (
              <option key={p.name} value={i}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label style={selectLabelStyle}>
          <span style={{ color: "#cbd5e1" }}>N:</span>
          <select
            value={props.count}
            onChange={(e) => props.onCountChange(parseInt(e.target.value, 10))}
            style={selectStyle}
          >
            {PARTICLE_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n.toLocaleString()}
              </option>
            ))}
          </select>
        </label>

        <Slider label="G" value={props.G} min={0} max={0.3} step={0.005} onChange={props.setG} />
        <Slider label="soft" value={props.softening} min={0.05} max={0.5} step={0.01} onChange={props.setSoftening} />

        <button
          onClick={() => props.setRunning(!props.running)}
          style={btnStyle(props.running ? "#7f1d1d" : "#0f766e", "#fff")}
        >
          {props.running ? "⏸" : "▶"}
        </button>

        <button
          onClick={props.onReset}
          disabled={!props.resetEnabled}
          style={btnStyle("transparent", props.resetEnabled ? "#94a3b8" : "#475569")}
        >
          ↺
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
          {(props.count * props.count / 1e6).toFixed(2)}M ops/step · status: {props.status}
        </div>
      </div>
    </header>
  );
}

const selectLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.35rem",
  fontSize: "0.78rem",
};

const selectStyle: React.CSSProperties = {
  background: "#1e293b",
  color: "#e2e8f0",
  border: "1px solid #334155",
  borderRadius: "4px",
  padding: "0.25rem 0.4rem",
  fontSize: "0.78rem",
  fontFamily: "inherit",
};

const btnStyle = (bg: string, color: string): React.CSSProperties => ({
  padding: "0.3rem 0.65rem",
  background: bg,
  color,
  border: "1px solid #334155",
  borderRadius: "4px",
  fontSize: "0.85rem",
  cursor: "pointer",
  minWidth: "32px",
});

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
