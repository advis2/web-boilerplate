import React from "react";

export const profile = {
  name: "Donguk Kam, Ph.D.",
  title: "R&D Leader @ Imagoworks",
  tagline: "3D 기하 알고리즘 → C++/WASM 엔진 → 웹 클라이언트 → 출시까지",
  domain: "Dental CAD/CAM · 3D Geometry Processing",
  email: "wadvisw@gmail.com",
  github: "https://github.com/advis2",
  summary:
    "3D 기하 알고리즘과 CAD 애플리케이션을 함께 만드는 엔지니어. " +
    "C++/WebAssembly 기하 엔진과 TypeScript 프론트엔드를 양쪽에서 직접 구현하며, " +
    "치과 CAD 제품을 5년간 출시·운영해 왔다. 개별 기능 구현에 그치지 않고 " +
    "아키텍처 경계를 lint·컴파일 옵션으로 기계가 강제하도록 코드베이스 구조를 바꿔 왔다. " +
    "서울대학교 기계항공공학부 공학박사 (Human Centered CAD Lab).",
} as const;

export const techStack: readonly { title: string; items: readonly string[] }[] = [
  {
    title: "Languages",
    items: ["C++ (17/20)", "TypeScript", "Python", "MATLAB", "GLSL", "WGSL"],
  },
  {
    title: "3D Geometry & Numerics",
    items: [
      "Mesh / Half-edge / BVH",
      "Parametrization",
      "ICP / 2D-3D Registration",
      "Bundle Adjustment",
      "Laplacian / ARAP Deformation",
      "Geodesics (Heat Method)",
      "ceres-solver",
      "OSQP",
      "OpenMesh",
      "VTK",
      "ITK",
      "Draco",
    ],
  },
  {
    title: "Graphics & GPU",
    items: ["OpenGL", "Qt", "WebGL", "WebGPU", "CUDA", "OpenCV"],
  },
  {
    title: "C++ / WebAssembly",
    items: ["Emscripten", "embind", "asyncify / JSPI", "CMake", "gTest"],
  },
  {
    title: "Web & App",
    items: [
      "React",
      "Next.js",
      "Redux",
      "Nx Monorepo",
      "Electron",
      "Node.js",
      "ESLint (module boundaries)",
      "Jest",
      "Cypress",
    ],
  },
  {
    title: "AI & Infra",
    items: [
      "ONNX Runtime",
      "Triton Inference Server",
      "AI Agent Orchestration",
      "Docker",
      "GitHub Actions",
      "AWS (EKS, S3)",
      "Azure Storage",
      "MongoDB",
    ],
  },
];

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
