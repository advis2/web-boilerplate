import React from "react";

export interface CaseStudy {
  name: string;
  context: string;
  problem: string;
  approach: string;
  outcome: string;
  tags: readonly string[];
}

// 사내 작업 case study 는 공개 레포에 평문으로 두지 않는다 (private.enc.json, PrivateSection 참조).
export const demoProjects: readonly CaseStudy[] = [
  {
    name: "Browser-side C++/WASM + WebGPU 3D Pipeline (Live Demos)",
    context: "이 사이트의 인터랙티브 데모",
    problem:
      "C++/WASM 엔진 + GPU 컴퓨팅 + 3D 시각화의 수직 통합 경험은 텍스트로 전달이 약하다. " +
      "직접 만져볼 수 있는 형태가 필요.",
    approach:
      "Emscripten + webgpu.h 로 C++ 가 compute pipeline / buffer / dispatch 를 직접 발행하고, " +
      "JS render pipeline 이 같은 GPU buffer 를 zero-copy 로 시각화:\n" +
      "  · /cuda-playground — WGSL compute shader 라이브 에디터 (16K particles)\n" +
      "  · /nbody — C++/WASM N-body O(N²) gravity kernel (512~8K particles, ~0.7ms/step)\n" +
      "  · /mesh — C++ 절차적 mesh + GPU vertex deformation (최대 ~33K vertex)",
    outcome:
      "방문자가 코드 수정 / 파라미터 조정 / 마우스 조작으로 동작을 직접 확인.",
    tags: ["C++", "WebAssembly", "WebGPU", "Live Demo"],
  },
];

export const researchProjects: readonly CaseStudy[] = [
  {
    name: "광학식 3D 스캐너 소프트웨어",
    context: "서울대 산학과제 5건 · 2014 — 2019",
    problem:
      "구조광 스캐너의 정밀도는 캘리브레이션·phase unwrapping·다중 시점 정합 오차의 누적. " +
      "어느 단계가 원인인지 분리하지 않으면 개선이 불가능.",
    approach:
      "· Phase unwrapping — KNN 탐색으로 오차 범위를 제어하는 temporal 기법 제안 (3주파수·6단계)\n" +
      "· 캘리브레이션 — 마커 기반 패턴 설계·검출로 스테레오 카메라·회전축 정밀도 동시 향상\n" +
      "· 정합 — 샘플링과 최적화를 분리한 ICP 재구현, 다중 시점 bundle adjustment",
    outcome:
      "캘리브레이션·재구성·정합 전 구간 구현. phase unwrapping 기법은 논문으로 게재.",
    tags: ["Structured Light", "Calibration", "ICP", "OpenGL"],
  },
  {
    name: "수술 내비게이션용 2D X-ray — 3D CT 정합",
    context: "서울대 산학과제 2건 · 2014 — 2016",
    problem:
      "로봇 보조 인공 슬관절 치환술(TKA)에서 수술 중 2D X-ray 로 환자 자세를 추정해 " +
      "CT 기반 계획과 맞춰야 한다. 정확도와 속도를 동시에 만족해야 한다.",
    approach:
      "steel ball 팬텀 + Gaussian fitting 서브픽셀 검출로 C-arm 파라미터 도출. " +
      "ray casting 기반 DRR 생성, AP·LAT 2방향 2D/3D 정합. " +
      "캘리브레이션 오차와 정합 오차를 분리 측정.",
    outcome:
      "전 구간 구현 후 납품. 후속 과제에서 광학 마커 없는 인대재건술 내비게이션(MRI·C-arm 정합)으로 확장.",
    tags: ["Medical Imaging", "2D/3D Registration", "DRR"],
  },
  {
    name: "스마트폰 영상 기반 타이어 트레드 깊이 측정",
    context: "서울대 산학과제 · 2014 — 2015",
    problem: "전용 장비 없이 휴대폰 영상만으로 트레드 깊이를 실제 치수로 재야 한다.",
    approach:
      "SfM 으로 표면 메시 복원 + 센서 데이터로 scale 보정. curvature 대신 volume descriptor 로 " +
      "트레드와 접지면을 분리하고, 최소자승 표면 피팅으로 깊이 추정.",
    outcome: "수동 측정값과 거의 동일한 깊이를 자동 획득. CAD/CAM 학회(2015) 발표.",
    tags: ["SfM", "Shape Descriptor", "Least Squares"],
  },
  {
    name: "박사학위 연구 — 자석에서 착안한 내부 구조 설계 도구",
    context: "서울대학교 · 2014 — 2021",
    problem:
      "적층 제조 부품의 내부 구조는 무게중심·강성·재료량을 좌우하지만, 기존 도구에는 " +
      "\"여기를 더 촘촘하게\"라는 설계 의도를 표현할 수단이 없었다.",
    approach:
      "사용자가 제어점을 놓으면 주변 Voronoi 셀이 조밀해지는 생성 규칙을 정의. " +
      "subdivision 으로 셀마다 원하는 두께의 skin 을 부여해 제조 가능한 형상으로 변환.",
    outcome: "응용으로 무게중심 제어와 선택 영역의 기계적 물성 개선을 제시.",
    tags: ["Solid Modeling", "Voronoi", "Additive Manufacturing"],
  },
];

export function ProjectCard(p: CaseStudy) {
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
      <header style={{ marginBottom: "0.75rem" }}>
        <h3
          style={{
            margin: "0 0 0.3rem",
            fontSize: "1.15rem",
            color: "#0f172a",
          }}
        >
          {p.name}
        </h3>
        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{p.context}</div>
      </header>

      <CaseRow label="Problem" body={p.problem} />
      <CaseRow label="Approach" body={p.approach} />
      <CaseRow label="Outcome" body={p.outcome} />

      <div
        style={{
          marginTop: "0.9rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
        }}
      >
        {p.tags.map((t) => (
          <span
            key={t}
            style={{
              fontSize: "0.72rem",
              padding: "0.2rem 0.55rem",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "999px",
              color: "#475569",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}

function CaseRow({ label, body }: { label: string; body: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "90px 1fr",
        gap: "0.75rem",
        margin: "0.5rem 0",
        fontSize: "0.92rem",
        lineHeight: 1.6,
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "#0f766e",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          paddingTop: "0.2rem",
        }}
      >
        {label}
      </div>
      <div style={{ color: "#475569", whiteSpace: "pre-wrap" }}>{body}</div>
    </div>
  );
}
