"use client";

import React, { FormEvent, ReactNode, useEffect, useState } from "react";
import encrypted from "./private.enc.json";
import type { Stat } from "./stats";
import type { TimelinePhase } from "./timeline";
import type { CaseStudy } from "./projects";

// 사내 작업 상세는 공개 레포에 평문으로 두지 않는다.
// 평문은 portfolio/private/about.private.json (gitignore), 암호문 생성은
// portfolio/scripts/encrypt-private.mjs. 파라미터(PBKDF2-SHA256 → AES-256-GCM)는 양쪽이 일치해야 한다.
export interface PrivateData {
  stats: readonly Stat[];
  timeline: readonly TimelinePhase[];
  projects: readonly CaseStudy[];
}

const SESSION_KEY = "about.private.pw";

function fromBase64(s: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function decrypt(password: string): Promise<PrivateData> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(encrypted.salt),
      iterations: encrypted.iter,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  // 비밀번호가 틀리면 GCM 태그 검증 실패로 reject 된다.
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(encrypted.iv) },
    key,
    fromBase64(encrypted.ct),
  );
  return JSON.parse(new TextDecoder().decode(plain)) as PrivateData;
}

interface PrivateSectionProps {
  children: (data: PrivateData) => ReactNode;
}

export function PrivateSection({ children }: PrivateSectionProps) {
  const [data, setData] = useState<PrivateData | null>(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");

  const unlock = async (pw: string) => {
    setStatus("busy");
    try {
      setData(await decrypt(pw));
      sessionStorage.setItem(SESSION_KEY, pw);
      setStatus("idle");
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      setStatus("error");
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) void unlock(saved);
  }, []);

  if (data) return <>{children(data)}</>;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password) void unlock(password);
  };

  return (
    <section
      style={{
        margin: "3rem 0",
        background: "#f8fafc",
        border: "1px dashed #cbd5e1",
        borderRadius: "10px",
        padding: "1.5rem 1.75rem",
      }}
    >
      <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.2rem", color: "#0f172a" }}>
        Industry Work (Protected)
      </h2>
      <p style={{ margin: "0 0 1rem", color: "#64748b", fontSize: "0.9rem" }}>
        재직 중인 회사의 작업 상세와 정량 지표는 비밀번호를 받은 분께만 공개합니다.
      </p>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          aria-label="Password"
          style={{
            padding: "0.5rem 0.75rem",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "0.95rem",
          }}
        />
        <button
          type="submit"
          disabled={status === "busy"}
          style={{
            padding: "0.5rem 1rem",
            background: "#0f766e",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: status === "busy" ? "wait" : "pointer",
          }}
        >
          {status === "busy" ? "확인 중…" : "열기"}
        </button>
      </form>
      {status === "error" && (
        <p style={{ margin: "0.6rem 0 0", color: "#b91c1c", fontSize: "0.85rem" }}>
          비밀번호가 올바르지 않습니다.
        </p>
      )}
    </section>
  );
}
