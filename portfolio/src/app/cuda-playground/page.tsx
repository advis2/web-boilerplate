"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { presets } from "./presets";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const WebGPUCanvas = dynamic(() => import("./WebGPUCanvas"), { ssr: false });

export default function CudaPlaygroundPage() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [code, setCode] = useState(presets[0].code);
  const [debouncedCode, setDebouncedCode] = useState(presets[0].code);
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  // 300ms debounce — 타이핑 중에 매번 재컴파일 안 함
  useEffect(() => {
    const t = setTimeout(() => setDebouncedCode(code), 300);
    return () => clearTimeout(t);
  }, [code]);

  const handlePreset = useCallback((idx: number) => {
    setPresetIdx(idx);
    setCode(presets[idx].code);
  }, []);

  const onError = useCallback((msg: string | null) => setError(msg), []);
  const onUnsupported = useCallback(() => setUnsupported(true), []);

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
        presetIdx={presetIdx}
        onPreset={handlePreset}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <EditorPane code={code} onChange={setCode} error={error} />
        <CanvasPane
          shaderCode={debouncedCode}
          onError={onError}
          onUnsupported={onUnsupported}
          unsupported={unsupported}
        />
      </div>
    </div>
  );
}

function Header({
  presetIdx,
  onPreset,
}: {
  presetIdx: number;
  onPreset: (idx: number) => void;
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
        <h1
          style={{
            margin: 0,
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "#f1f5f9",
          }}
        >
          GPU Compute Playground
        </h1>
        <p
          style={{
            margin: "0.15rem 0 0",
            fontSize: "0.78rem",
            color: "#94a3b8",
          }}
        >
          WebGPU 기반 — CUDA 커널과 동일한 SIMT 모델 (WGSL). 코드 수정 시 ~300ms 후 실시간 반영.
        </p>
      </div>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: "0.4rem",
          flexWrap: "wrap",
        }}
      >
        {presets.map((p, i) => (
          <button
            key={p.name}
            onClick={() => onPreset(i)}
            style={{
              padding: "0.4rem 0.85rem",
              background: i === presetIdx ? "#0f766e" : "#1e293b",
              color: i === presetIdx ? "#fff" : "#cbd5e1",
              border: "1px solid #334155",
              borderRadius: "6px",
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 120ms",
            }}
            title={p.description}
          >
            {p.name}
          </button>
        ))}
      </div>
    </header>
  );
}

function EditorPane({
  code,
  onChange,
  error,
}: {
  code: string;
  onChange: (v: string) => void;
  error: string | null;
}) {
  return (
    <div
      style={{
        flex: "0 0 48%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #1e293b",
        minWidth: 0,
      }}
    >
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          defaultLanguage="rust"
          language="rust"
          theme="vs-dark"
          value={code}
          onChange={(v) => onChange(v ?? "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "off",
            tabSize: 2,
            renderWhitespace: "selection",
            automaticLayout: true,
          }}
        />
      </div>
      <ErrorBar error={error} />
    </div>
  );
}

function ErrorBar({ error }: { error: string | null }) {
  if (!error) {
    return (
      <div
        style={{
          padding: "0.45rem 0.85rem",
          background: "#0f172a",
          borderTop: "1px solid #1e293b",
          color: "#64748b",
          fontSize: "0.78rem",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
      >
        ✓ compiled
      </div>
    );
  }
  return (
    <div
      style={{
        padding: "0.6rem 0.85rem",
        background: "#3f1d2e",
        borderTop: "1px solid #7f1d1d",
        color: "#fda4af",
        fontSize: "0.78rem",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        whiteSpace: "pre-wrap",
        maxHeight: "140px",
        overflowY: "auto",
      }}
    >
      ✗ {error}
    </div>
  );
}

function CanvasPane({
  shaderCode,
  onError,
  onUnsupported,
  unsupported,
}: {
  shaderCode: string;
  onError: (msg: string | null) => void;
  onUnsupported: () => void;
  unsupported: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        minWidth: 0,
        background: "#0f172a",
      }}
    >
      {unsupported ? (
        <UnsupportedBanner />
      ) : (
        <WebGPUCanvas
          shaderCode={shaderCode}
          onError={onError}
          onUnsupported={onUnsupported}
        />
      )}
      <Hint />
    </div>
  );
}

function UnsupportedBanner() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "0.75rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "2.5rem" }}>⚠</div>
      <h2 style={{ margin: 0, color: "#f1f5f9" }}>WebGPU 미지원 브라우저</h2>
      <p style={{ margin: 0, color: "#94a3b8", maxWidth: 480 }}>
        이 데모는 WebGPU API를 사용합니다. Chrome / Edge 113+, Safari 26.1+,
        Firefox 141+ (또는 별도 활성화) 에서 동작합니다.
      </p>
    </div>
  );
}

function Hint() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "0.75rem",
        right: "0.75rem",
        background: "rgba(15, 23, 42, 0.85)",
        border: "1px solid #1e293b",
        borderRadius: "6px",
        padding: "0.4rem 0.7rem",
        color: "#94a3b8",
        fontSize: "0.72rem",
        fontFamily: "ui-monospace, monospace",
        pointerEvents: "none",
      }}
    >
      drag · wheel · 16,384 particles
    </div>
  );
}
