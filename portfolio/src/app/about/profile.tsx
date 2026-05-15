import React from "react";

export const profile = {
  name: "Donguk Kam, Ph.D.",
  title: "Senior Full-Stack / Systems Engineer",
  tagline:
    "C++/WASM 엔진 → 모노레포 풀스택 → 수직 통합 설계자",
  domain: "3D Medical · CAD/CAM SaaS",
  email: "wadvisw@gmail.com",
  github: "https://github.com/advis2",
  summary:
    "단일 도메인에서 5년+ 동안 C++/WASM 엔진 개발, React/TypeScript 모노레포 설계, " +
    "그리고 둘을 잇는 수직 통합 아키텍처를 의식적으로 진화시켜 온 시스템 엔지니어. " +
    "기능 추가보다 레이어 경계 정립, SSOT 정합성, 회귀 방지 인프라 구축에 시간을 투자한다.",
} as const;

export const techStack = {
  frontend: [
    "TypeScript",
    "React",
    "Next.js",
    "Redux",
    "Zustand",
    "MUI",
    "styled-components",
    "Zod",
  ],
  backend: ["NestJS", "Node.js", "REST", "Python"],
  cppWasm: [
    "C++",
    "CMake",
    "Emscripten",
    "OpenMesh",
    "VTK",
    "ITK",
    "OpenCV",
    "OpenGL",
    "Qt",
    "onnxruntime",
  ],
  devx: [
    "Nx",
    "rspack",
    "ESLint (module boundaries)",
    "Jest",
    "Cypress",
    "GitHub Actions",
    "Azure Pipelines",
  ],
  domain: [
    "3D Mesh Processing",
    "Computer-Aided Design",
    "Medical Imaging",
    "AI Inference Integration",
    "WebAssembly Pipelines",
  ],
} as const;

interface TechStackProps {
  title: string;
  items: readonly string[];
}

export function TechStack({ title, items }: TechStackProps) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <h3
        style={{
          marginBottom: "0.75rem",
          fontSize: "1.05rem",
          color: "#334155",
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {items.map((item) => (
          <span
            key={item}
            style={{
              padding: "0.35rem 0.75rem",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "999px",
              fontSize: "0.85rem",
              color: "#475569",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
