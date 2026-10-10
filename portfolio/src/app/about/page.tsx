"use client";

import React, { ReactNode } from "react";
import { profile, TechStack, techStack } from "./profile";
import { demoProjects, ProjectCard, researchProjects } from "./projects";
import { PrivateSection } from "./PrivateSection";
import { Timeline } from "./timeline";
import { Stats } from "./stats";
import {
  PublicationCard,
  PublicationsEmpty,
  publications,
} from "./publications";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

function Section({ title, subtitle, children }: SectionProps) {
  return (
    <section style={{ margin: "3rem 0" }}>
      <header
        style={{
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "0.6rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "1.5rem",
            color: "#0f172a",
            fontWeight: 600,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              margin: "0.4rem 0 0",
              color: "#64748b",
              fontSize: "0.92rem",
            }}
          >
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <main
      style={{
        maxWidth: "880px",
        margin: "0 auto",
        padding: "0 1rem 4rem",
        color: "#0f172a",
      }}
    >
      <header style={{ marginTop: "2.5rem" }}>
        <h1
          style={{
            margin: "0 0 0.5rem",
            fontSize: "2.1rem",
            letterSpacing: "-0.01em",
          }}
        >
          {profile.name}
        </h1>
        <p
          style={{
            margin: "0 0 0.25rem",
            fontSize: "1.05rem",
            color: "#334155",
            fontWeight: 500,
          }}
        >
          {profile.title} · {profile.domain}
        </p>
        <p
          style={{
            margin: "0 0 1.25rem",
            color: "#0f766e",
            fontSize: "0.95rem",
            fontStyle: "italic",
          }}
        >
          {profile.tagline}
        </p>
        <p
          style={{
            margin: "0 0 1rem",
            color: "#475569",
            lineHeight: 1.7,
          }}
        >
          {profile.summary}
        </p>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
          <a
            href={`mailto:${profile.email}`}
            style={{ color: "#0f766e", textDecoration: "none" }}
          >
            {profile.email}
          </a>
          {" · "}
          <a
            href={profile.github}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0f766e", textDecoration: "none" }}
          >
            GitHub
          </a>
        </p>
      </header>

      <PrivateSection>
        {(data) => (
          <>
            <Section
              title="At a Glance"
              subtitle="이마고웍스 재직 기간 개인 활동 지표 (2021.02 — 2026.08)"
            >
              <Stats stats={data.stats} />
            </Section>

            <Section
              title="Career Timeline"
              subtitle="기하 알고리즘 연구 → C++ 엔진 → 제품 출시 → 수직 통합"
            >
              <Timeline timeline={data.timeline} />
            </Section>

            <Section
              title="Case Studies — Industry"
              subtitle="기능 추가가 아닌 구조 변경 위주로 선별"
            >
              {data.projects.map((p) => (
                <ProjectCard key={p.name} {...p} />
              ))}
            </Section>
          </>
        )}
      </PrivateSection>

      <Section
        title="Case Studies — Research"
        subtitle="서울대학교 Human Centered CAD Lab 산학과제 · 박사학위 연구"
      >
        {researchProjects.map((p) => (
          <ProjectCard key={p.name} {...p} />
        ))}
      </Section>

      <Section title="Live Demos">
        {demoProjects.map((p) => (
          <ProjectCard key={p.name} {...p} />
        ))}
      </Section>

      <Section title="Technical Expertise">
        {techStack.map((t) => (
          <TechStack key={t.title} title={t.title} items={t.items} />
        ))}
      </Section>

      <Section title="Publications">
        {publications.length === 0 ? (
          <PublicationsEmpty />
        ) : (
          publications.map((pub) => (
            <PublicationCard key={pub.title} {...pub} />
          ))
        )}
      </Section>
    </main>
  );
}
