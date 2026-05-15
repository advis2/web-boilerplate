"use client";

import React from "react";
import Link from "next/link";
import { Typography, Button } from "@mui/material";
import "./global.css";
import { RoundBox } from "./RoundBox";

export default function HomePage() {
  return (
    <div className="container">
      <RoundBox>
        <Typography
          variant="overline"
          sx={{ color: "#0f766e", letterSpacing: "0.08em" }}
        >
          Donguk Kam · Senior Full-Stack / Systems Engineer
        </Typography>

        <Typography
          variant="h3"
          gutterBottom
          sx={{ mt: 1, fontWeight: 600, lineHeight: 1.2 }}
        >
          C++/WASM 엔진과<br />
          모노레포 풀스택을 잇는 설계자
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 2, lineHeight: 1.7 }}
        >
          5년+ 동안 3D Medical / CAD-CAM 도메인에서 엔진 → 풀스택 → 수직 통합으로
          의식적으로 진화해 온 시스템 엔지니어. 기능 추가보다 레이어 경계, SSOT,
          회귀 방지 인프라에 시간을 투자합니다.
        </Typography>

        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
          <Link href="/about" style={{ textDecoration: "none" }}>
            <Button variant="contained" color="primary">
              About / Case Studies
            </Button>
          </Link>
          <Link href="/projects" style={{ textDecoration: "none" }}>
            <Button variant="outlined" color="primary">
              Projects
            </Button>
          </Link>
        </div>
      </RoundBox>
    </div>
  );
}
