"use client";

import { profile, TechStack, techStack } from "./profile";
import { PublicationCard, publications } from "./publications";
import { ProjectCard, projects } from "./projects";
import { ReactNode } from "react"

interface SectionProps {
  title: string
  children: ReactNode
}
function Section({ title, children }: SectionProps) {
  return (
    <section style={{ margin: "4rem 0" }}>
      <h2 style={{ borderBottom: "2px solid #ddd", paddingBottom: "0.5rem" }}>
        {title}
      </h2>
      <div style={{ marginTop: "1.5rem" }}>{children}</div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <main>
      {/* Header */}
      <header style={{ marginTop: "3rem" }}>
        <h1>{profile.name}</h1>
        <p>{profile.title}</p>
        <p>{profile.affiliation}</p>
        <p>
          Email: {profile.email} | 
          <a href={profile.github}> GitHub</a> | 
        </p>
      </header>

      {/* Research Interests */}
      <Section title="Research Interests">
        <ul>
          {profile.researchInterests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
      </Section>

      {/* Publications */}
      <Section title="Selected Publications">
        {publications.map((pub) => (
          <PublicationCard key={pub.title} {...pub} />
        ))}
      </Section>

      {/* Projects */}
      <Section title="Projects">
        {projects.map((proj) => (
          <ProjectCard key={proj.name} {...proj} />
        ))}
      </Section>

      {/* Tech stack */}
      <Section title="Technical Expertise">
        <TechStack title="Engineering Stack" items={techStack.engineering} />
        <TechStack title="Tools Stack" items={techStack.tools} />
      </Section>      
    </main>
  )
}