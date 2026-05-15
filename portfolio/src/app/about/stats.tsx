import React from "react";

export interface Stat {
  label: string;
  value: string;
  hint?: string;
}

export const stats: readonly Stat[] = [
  { label: "Years in domain", value: "5+", hint: "단일 도메인 long-term" },
  { label: "Commits", value: "10K+", hint: "조직 전체 누적" },
  { label: "Merged PRs", value: "1.5K+", hint: "조직 전체 누적" },
  { label: "Legacy LOC removed", value: "40K+", hint: "단일 패키지 청산" },
  { label: "Hexagonal migrations", value: "9", hint: "feature 단위 점진" },
  { label: "AI models integrated", value: "10+", hint: "C++/WASM ↔ remote" },
];

export function Stats() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: "1rem",
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "1.1rem 1.25rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              fontSize: "1.65rem",
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.1,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.85rem",
              color: "#475569",
              fontWeight: 500,
            }}
          >
            {s.label}
          </div>
          {s.hint && (
            <div
              style={{
                marginTop: "0.2rem",
                fontSize: "0.75rem",
                color: "#94a3b8",
              }}
            >
              {s.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
