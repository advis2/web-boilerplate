"use client";

import React, { useEffect, useState } from "react";

interface NBodyModule {
  _nbody_hello: () => number;
  _nbody_init_webgpu: () => number;
  _nbody_get_device_handle: () => number;
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
    const pushResult = (r: StepResult) =>
      setResults((prev) => [...prev, r]);

    (async () => {
      try {
        // 1. WebGPU 지원 확인
        setStatus("checking WebGPU support…");
        if (!navigator.gpu) {
          throw new Error("WebGPU not supported by this browser");
        }
        pushResult({ label: "navigator.gpu", value: "available", ok: true });

        // 2. adapter / device
        setStatus("requesting adapter / device…");
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("no GPU adapter");
        const device = await adapter.requestDevice();
        if (cancelled) return;
        pushResult({
          label: "GPUDevice (JS)",
          value: `acquired (limits.maxStorageBufferBindingSize=${device.limits.maxStorageBufferBindingSize})`,
          ok: true,
        });

        // 3. factory + preinitializedWebGPUDevice
        setStatus("fetching factory…");
        const factory = await loadWasmFactory("/wasm/nbody.js");
        if (cancelled) return;

        setStatus("instantiating wasm (sharing device)…");
        const Module = await factory({
          locateFile: (f) => `/wasm/${f}`,
          preinitializedWebGPUDevice: device,
        });
        if (cancelled) return;

        // 4. C++가 device 받았는지 검증
        const hello = Module._nbody_hello();
        pushResult({
          label: "nbody_hello() (sanity)",
          value: String(hello),
          ok: hello === 42,
        });

        const initRc = Module._nbody_init_webgpu();
        pushResult({
          label: "nbody_init_webgpu() return code",
          value: initRc === 0 ? "0 (OK)" : `${initRc} (FAIL)`,
          ok: initRc === 0,
        });

        const handle = Module._nbody_get_device_handle();
        pushResult({
          label: "C++ WGPUDevice handle",
          value: handle ? `0x${handle.toString(16)}` : "null",
          ok: handle !== 0,
        });

        setStatus(initRc === 0 ? "ok" : "error");
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
        maxWidth: 720,
        margin: "2rem auto",
        padding: "0 1rem",
        color: "#0f172a",
      }}
    >
      <h1 style={{ margin: "0 0 0.5rem" }}>N-Body (C++ / WASM + WebGPU)</h1>
      <p style={{ margin: "0 0 1.5rem", color: "#64748b", fontSize: "0.95rem" }}>
        <strong>Step 2:</strong> JS에서 만든 WebGPU device를 emscripten 런타임을
        통해 C++가 받아 동일 device 위에서 작업할 수 있는지 검증.
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

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} style={{ borderTop: i > 0 ? "1px solid #e2e8f0" : "none" }}>
                <td style={{ padding: "0.4rem 0.5rem 0.4rem 0", color: "#475569" }}>
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
          <li>Step 3: webgpu.h로 buffer/pipeline 생성 + N-body compute kernel dispatch</li>
          <li>Step 4: GPU buffer를 JS render pipeline과 share</li>
          <li>Step 5: UI polish (FPS, particle count, init patterns)</li>
        </ul>
        <p style={{ marginTop: "1rem" }}>
          <strong>C++ 측 stdout:</strong> 브라우저 DevTools Console에 출력
          (<code>[C++] WebGPU device acquired ...</code>)
        </p>
      </section>
    </main>
  );
}
