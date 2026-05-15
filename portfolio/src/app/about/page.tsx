"use client";

import React, { ReactNode } from "react";
import { profile, TechStack, techStack } from "./profile";
import { ProjectCard, projects } from "./projects";
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

      <Section
        title="At a Glance"
        subtitle="단일 도메인 long-term 활동의 정량 지표 (조직 전체 기준)"
      >
        <Stats />
      </Section>

      <Section
        title="Career Timeline"
        subtitle="C++ 엔진 → 풀스택 → 수직 통합으로 이어지는 의식적 진화"
      >
        <Timeline />
      </Section>

      <Section
        title="Case Studies"
        subtitle="기능 추가가 아닌 시스템 규모 변경 위주로 선별"
      >
        {projects.map((p) => (
          <ProjectCard key={p.name} {...p} />
        ))}
      </Section>

      <Section title="Technical Expertise">
        <TechStack title="Frontend" items={techStack.frontend} />
        <TechStack title="Backend" items={techStack.backend} />
        <TechStack title="C++ / WebAssembly" items={techStack.cppWasm} />
        <TechStack title="Build & DevX" items={techStack.devx} />
        <TechStack title="Domain" items={techStack.domain} />
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
