import React from "react";

export interface Stat {
  label: string;
  value: string;
  hint?: string;
}

export function Stats({ stats }: { stats: readonly Stat[] }) {
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
