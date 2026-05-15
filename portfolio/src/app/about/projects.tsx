import React from "react";

export interface CaseStudy {
  name: string;
  context: string;
  problem: string;
  approach: string;
  outcome: string;
  tags: readonly string[];
}

export const projects: readonly CaseStudy[] = [
  {
    name: "C++/WASM 엔진 ↔ 모노레포 풀스택 수직 통합",
    context: "3D Medical SaaS 도메인",
    problem:
      "C++ 도메인 엔진과 React/TypeScript 프론트가 별도 리포에서 진화하며 " +
      "프로세스/추론 경계가 모호해지고, 엔진 변경이 풀스택 회귀로 이어짐.",
    approach:
      "엔진 inference layer 와 프론트 process layer 사이에 sibling 패턴을 " +
      "도입해 client-local / remote 추론을 동일 인터페이스로 분리. " +
      "분할 시리즈 PR 로 10+ AI 모듈을 단일 패턴으로 균일 마이그레이션.",
    outcome:
      "추론 컴퓨팅의 배치 지점을 자유롭게 선택 가능, 엔진/프론트 간 계약이 " +
      "테스트 가능한 단위로 정형화.",
    tags: ["C++", "WebAssembly", "AI Inference", "Architecture"],
  },
  {
    name: "대규모 레거시 패키지 청산 (40K+ LOC)",
    context: "백엔드 통합 후 무용해진 SDK 정리",
    problem:
      "백엔드 통합으로 사용처가 사라진 단일 SDK 패키지가 build/CI 비용과 " +
      "신규 입사자 학습 비용을 지속적으로 발생시킴.",
    approach:
      "호출처 audit → 단계적 deprecate → ownership 명확화 후 " +
      "단일 PR 로 4만+ 라인 일괄 제거.",
    outcome:
      "build / lint / 모노레포 graph 단축, 도메인 모델 단순화. " +
      "동일 패턴으로 ImagoEvent / ImplantLibraryDB 등 유사 청산 진행.",
    tags: ["Refactoring", "Monorepo", "Ownership"],
  },
  {
    name: "Feature-based Hexagonal Migration (9 features)",
    context: "라자냐 layer 구조에서 feature-based 로 점진 전환",
    problem:
      "states / manager / process 의 가로 layer 구조에서 cross-cut 회귀가 " +
      "빈발하고, ESLint 경계 부재로 feature 간 직접 import 가 누적.",
    approach:
      "12 원칙 명세 + ESLint enforce-module-boundaries / boundaries 룰 설계. " +
      "margin-line pilot 후 8 features 점진 확장. 각 feature 가 api / commands / " +
      "domain / infra / hooks / __tests__ 5층을 강제.",
    outcome:
      "feature 간 직접 import 차단, singleton 직접 호출 제거, " +
      "context 명시 주입 강제. feature-local 테스트 가능.",
    tags: ["Hexagonal", "ESLint", "Architecture", "Migration"],
  },
  {
    name: "회귀 방지 인프라의 메타화",
    context: "버그 수정이 다시 깨지는 패턴, spec 의 false-PASS 누적",
    problem:
      "버그 fix 가 회귀하거나, source-text grep 으로만 PASS 한 spec 이 " +
      "실제 사용자 시나리오에서는 fail 하는 경우가 누적.",
    approach:
      "bug-fix-regression / flow-test-authoring / complex-ui-state 규칙을 " +
      "팀 차원의 명세로 문서화. PR 본문 패턴 (원인 / 고정 수단 / sanity / " +
      "후속 트랙) 표준화, it.fails 박제 패턴 도입.",
    outcome:
      "PR 본문 일관화, 회귀 가드 spec 표준화. test : fix 비율이 " +
      "거의 1:1 로 정착.",
    tags: ["Testing", "Process", "Tech Lead"],
  },
  {
    name: "Build & DevX Infrastructure",
    context: "Nx 모노레포의 빌드/캐시/CI 안정화",
    problem:
      "feature 증가에 따라 빌드 시간 / lint 시간 / CI flakiness 가 증가, " +
      "개발자 피드백 루프가 길어짐.",
    approach:
      "Nx target 명시화, rspack 도입, batch-perf workflow 정비, " +
      "GitHub Actions / Azure Pipelines 의 캐싱·디버깅 인프라 정비.",
    outcome:
      "CI 피드백 루프 단축, cypress flakiness 감소, " +
      "feature 단위 incremental build 정상화.",
    tags: ["Nx", "rspack", "CI/CD", "DevX"],
  },
] as const;

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
      <div style={{ color: "#475569" }}>{body}</div>
    </div>
  );
}
