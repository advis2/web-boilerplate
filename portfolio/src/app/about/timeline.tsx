import React from "react";

export interface TimelinePhase {
  phase: string;
  period: string;
  role: string;
  summary: string;
  highlights: readonly string[];
}

export function Timeline({
  timeline,
}: {
  timeline: readonly TimelinePhase[];
}) {
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
