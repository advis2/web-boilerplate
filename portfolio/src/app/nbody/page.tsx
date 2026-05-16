"use client";

import React, { useEffect, useState } from "react";

interface NBodyModule {
  _nbody_hello: () => number;
  _nbody_malloc: (n: number) => number;
  _nbody_free: (p: number) => void;
  _malloc: (n: number) => number;
  _free: (p: number) => void;
  HEAPF32: Float32Array;
  HEAPU32: Uint32Array;
  HEAP8: Int8Array;
}

declare global {
  interface Window {
    createNBodyModule?: () => Promise<NBodyModule>;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default function NBodyPage() {
  const [status, setStatus] = useState("idle");
  const [helloResult, setHelloResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading script…");
        await loadScript("/wasm/nbody.js");
        if (cancelled) return;

        if (!window.createNBodyModule) {
          throw new Error("createNBodyModule not found on window");
        }

        setStatus("instantiating wasm…");
        const Module = await window.createNBodyModule();
        if (cancelled) return;

        setStatus("calling nbody_hello()…");
        const result = Module._nbody_hello();
        setHelloResult(result);
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
        maxWidth: 720,
        margin: "2rem auto",
        padding: "0 1rem",
        color: "#0f172a",
      }}
    >
      <h1 style={{ margin: "0 0 0.5rem" }}>N-Body (C++ / WASM + WebGPU)</h1>
      <p style={{ margin: "0 0 1.5rem", color: "#64748b", fontSize: "0.95rem" }}>
        Step 1: 최소 WASM 모듈 로드 + C 함수 호출 검증.
        다음 step에서 webgpu.h로 GPU compute 통합 예정.
      </p>

      <section
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "1.25rem 1.5rem",
        }}
      >
        <div style={{ marginBottom: "0.5rem" }}>
          <strong>status:</strong>{" "}
          <code
            style={{
              padding: "0.15rem 0.5rem",
              background: status === "ok" ? "#dcfce7" : status === "error" ? "#fee2e2" : "#fef9c3",
              color: status === "ok" ? "#15803d" : status === "error" ? "#991b1b" : "#854d0e",
              borderRadius: "4px",
              fontSize: "0.85rem",
            }}
          >
            {status}
          </code>
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <strong>nbody_hello() result:</strong>{" "}
          <code style={{ fontFamily: "ui-monospace, monospace" }}>
            {helloResult === null ? "(pending)" : helloResult}
          </code>
          {helloResult === 42 && (
            <span style={{ marginLeft: "0.5rem", color: "#15803d" }}>✓ expected 42</span>
          )}
        </div>

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
          <li>Step 2: emscripten_webgpu_get_device() 로 JS WebGPU device 공유</li>
          <li>Step 3: webgpu.h로 buffer/pipeline 생성 + N-body kernel dispatch</li>
          <li>Step 4: GPU buffer를 JS render pipeline과 share</li>
          <li>Step 5: UI polish (FPS, particle count, init patterns)</li>
        </ul>
      </section>
    </main>
  );
}
