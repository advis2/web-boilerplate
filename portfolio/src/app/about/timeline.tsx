import React from "react";

export interface TimelinePhase {
  phase: string;
  period: string;
  role: string;
  summary: string;
  highlights: readonly string[];
}

export const timeline: readonly TimelinePhase[] = [
  {
    phase: "Phase 1",
    period: "2021 — 2024 (4 years)",
    role: "C++ / WebAssembly Engine Engineer",
    summary:
      "도메인 CAD/CAM 엔진의 핵심 contributor. 3D 메시 처리, " +
      "WebAssembly 빌드 파이프라인, AI 추론 통합을 담당.",
    highlights: [
      "도메인 알고리즘 (Mesh Segmentation, ROI 추출, 보철물 합성 등)",
      "Emscripten 기반 WebAssembly 빌드 파이프라인",
      "10+ AI 모델 추론 통합 (onnxruntime)",
    ],
  },
  {
    phase: "Phase 2",
    period: "2025 — present (1.5+ years)",
    role: "Full-Stack System Designer",
    summary:
      "React/TypeScript 모노레포로 무게중심 이동. process / state / feature " +
      "아키텍처와 빌드 인프라, 회귀 방지 시스템 설계.",
    highlights: [
      "Feature-based Hexagonal Migration (9개 feature 점진 전환)",
      "ESLint module-boundaries로 레이어 경계 컴파일 타임 강제",
      "회귀 가드 spec 패턴 / 테스트 작성 원칙 메타화",
    ],
  },
  {
    phase: "Phase 3",
    period: "2026 — present",
    role: "Vertical Stack Integrator",
    summary:
      "프론트 모노레포의 process layer 와 C++/WASM 엔진의 inference layer 를 " +
      "수직 통합하는 아키텍처 설계.",
    highlights: [
      "AI 추론 컴퓨팅을 client → remote 로 분리하는 sibling 패턴",
      "10+ 추론 모듈을 단일 패턴으로 균일 변환",
      "분할 시리즈 PR 로 대규모 동질 변환을 안전하게 점진 적용",
    ],
  },
];

export function Timeline() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {timeline.map((p) => (
        <article
          key={p.phase}
          style={{
            position: "relative",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderLeft: "4px solid #0f766e",
            borderRadius: "8px",
            padding: "1.25rem 1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "0.4rem",
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#0f766e",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {p.phase}
            </span>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              {p.period}
            </span>
          </div>
          <h3
            style={{
              margin: "0 0 0.5rem",
              fontSize: "1.1rem",
              color: "#0f172a",
            }}
          >
            {p.role}
          </h3>
          <p
            style={{
              margin: "0 0 0.75rem",
              color: "#475569",
              lineHeight: 1.6,
            }}
          >
            {p.summary}
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.1rem",
              color: "#475569",
              fontSize: "0.9rem",
              lineHeight: 1.7,
            }}
          >
            {p.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
