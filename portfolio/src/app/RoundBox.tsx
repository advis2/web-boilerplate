// apps/portfolio/src/app/components/RoundBox.tsx
'use client';

import React, { ReactNode } from 'react';

interface RoundBoxProps {
  children: ReactNode;
  padding?: string; // 내부 여백
  bgColor?: string; // 배경색
}

export function RoundBox({
  children,
  padding = '1rem',
  bgColor = '#f3f4f6',
}: RoundBoxProps) {
  return (
    <div
      className="round-box"
      style={{
        padding,
        backgroundColor: bgColor,
        borderRadius: '1rem',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      }}
    >
      {children}
    </div>
  );
}