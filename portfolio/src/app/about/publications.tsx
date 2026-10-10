import React from "react";

export interface Publication {
  title: string;
  venue: string;
  year: number;
  description: string;
}

export const publications: readonly Publication[] = [
  {
    title:
      "Magnet-inspired intuitive design tool for inner structures of solid models",
    venue: "Ph.D. Dissertation, Seoul National University",
    year: 2021,
    description:
      "제어점 주변에 Voronoi 셀이 조밀해지는 대화형 내부 구조 설계 도구. " +
      "무게중심 제어와 국소 물성 개선에 응용.",
  },
  {
    title: "Unwrapped phase correction for robust 3D scanning",
    venue: "Dong-Uk Kam, Jeong Hee Kim, Kunwoo Lee",
    year: 2019,
    description:
      "KNN 탐색으로 wrapped phase 오차 범위를 제어하는 temporal phase unwrapping. " +
      "3개 주파수·6단계 패턴 이동으로 fringe order 정확도와 스캔 로버스트성 향상.",
  },
  {
    title:
      "Localized triangle mesh generation algorithm for parallel computation",
    venue: "한국CAD/CAM학회",
    year: 2014,
    description:
      "정점마다 Voronoi 조건을 만족하는 다각형을 국소적으로 구성해 " +
      "병렬화 가능한 Delaunay triangulation 을 계산.",
  },
  {
    title: "삼각형 메쉬 상에서의 미분연산자",
    venue: "한국CAD/CAM학회 하계 학술대회 — 우수논문상",
    year: 2014,
    description: "삼각형 메시 위의 이산 미분연산자.",
  },
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
