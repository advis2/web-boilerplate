// encrypt-private.mjs — /about 의 비공개 섹션 데이터를 암호화해 커밋 가능한 형태로 만든다.
//
// 평문(portfolio/private/about.private.json)은 .gitignore 대상이다. 공개 레포에는
// 아래 출력 파일(암호문)만 올라가고, 브라우저가 비밀번호로 복호화한다.
//
// 사용: ABOUT_PASSWORD=xxxx node portfolio/scripts/encrypt-private.mjs
//
// 형식: PBKDF2-SHA256(password, salt, ITER) → AES-256-GCM. 클라이언트 복호화는
// src/app/about/PrivateSection.tsx 와 파라미터가 일치해야 한다.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto as crypto } from "node:crypto";

const ITER = 600_000;

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../private/about.private.json");
const dst = resolve(here, "../src/app/about/private.enc.json");

const password = process.env.ABOUT_PASSWORD;
if (!password) {
  console.error("ABOUT_PASSWORD env var is required");
  process.exit(1);
}

const plaintext = readFileSync(src, "utf8");
JSON.parse(plaintext); // 깨진 JSON 을 암호화하지 않도록 검증

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const baseKey = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveKey"],
);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
  baseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"],
);
const ct = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  new TextEncoder().encode(plaintext),
);

const b64 = (buf) => Buffer.from(buf).toString("base64");
writeFileSync(
  dst,
  JSON.stringify(
    { v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) },
    null,
    2,
  ) + "\n",
);
console.log(`wrote ${dst}`);
