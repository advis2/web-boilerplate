import React from "react";

export interface Publication {
  title: string;
  venue: string;
  year: number;
  description: string;
}

export const publications: readonly Publication[] = [
  // TODO: 실제 publication 정보로 교체
];

export function PublicationCard({
  title,
  venue,
  year,
  description,
}: Publication) {
  return (
    <article
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        padding: "1.5rem 1.75rem",
        borderRadius: "10px",
        marginBottom: "1.25rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <h3
        style={{
          margin: "0 0 0.4rem",
          fontSize: "1.1rem",
          color: "#0f172a",
        }}
      >
        {title}
      </h3>
      <p style={{ margin: "0 0 0.5rem", color: "#64748b", fontSize: "0.9rem" }}>
        <strong>{venue}</strong>, {year}
      </p>
      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
        {description}
      </p>
    </article>
  );
}

export function PublicationsEmpty() {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px dashed #cbd5e1",
        borderRadius: "8px",
        padding: "1.25rem 1.5rem",
        color: "#64748b",
        fontSize: "0.9rem",
      }}
    >
      준비 중입니다. 공개 가능한 publication 이 정리되는 대로 업데이트됩니다.
    </div>
  );
}
