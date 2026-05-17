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

type NBodyFactory = (opts?: object) => Promise<NBodyModule>;

// emcc 산출물의 `var createNBodyModule = ...`는 동적 <script>에서
// window에 항상 떨어지진 않음 (strict / module 컨텍스트 등).
// fetch + new Function으로 factory를 직접 추출해 안정성 확보.
async function loadWasmFactory(jsSrc: string): Promise<NBodyFactory> {
  const res = await fetch(jsSrc);
  if (!res.ok) throw new Error(`fetch ${jsSrc} → ${res.status}`);
  const code = await res.text();
  // new Function의 body는 함수 스코프 — var는 글로벌로 누수 안 됨.
  // 끝에 return으로 factory 노출.
  const factory = new Function(`${code}\n;return createNBodyModule;`)();
  if (typeof factory !== "function") {
    throw new Error("createNBodyModule factory not exported");
  }
  return factory as NBodyFactory;
}

export default function NBodyPage() {
  const [status, setStatus] = useState("idle");
  const [helloResult, setHelloResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("fetching factory…");
        const factory = await loadWasmFactory("/wasm/nbody.js");
        if (cancelled) return;

        setStatus("instantiating wasm…");
        // locateFile: emcc가 nbody.wasm 받을 URL을 지정.
        // new Function 컨텍스트라 _scriptDir 추론 안 됨 → 명시 필요.
        const Module = await factory({
          locateFile: (filename: string) => `/wasm/${filename}`,
        });
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
