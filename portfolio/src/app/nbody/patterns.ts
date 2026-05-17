// Initial particle distributions.
// Particle stride: 8 floats (pos.xyz, _p0, vel.xyz, _p1)

const STRIDE = 8;

export interface InitPattern {
  name: string;
  description: string;
  generate: (n: number) => Float32Array;
  defaultG: number;
  defaultSoftening: number;
}

function alloc(n: number): Float32Array {
  return new Float32Array(n * STRIDE);
}

function setParticle(
  data: Float32Array,
  i: number,
  x: number, y: number, z: number,
  vx: number, vy: number, vz: number,
) {
  const o = i * STRIDE;
  data[o + 0] = x;
  data[o + 1] = y;
  data[o + 2] = z;
  data[o + 4] = vx;
  data[o + 5] = vy;
  data[o + 6] = vz;
}

// ---------- Sphere shell (회전) ----------
function generateSphere(n: number): Float32Array {
  const data = alloc(n);
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = 0.7 + Math.random() * 0.6;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    // y축 기준 접선 속도
    setParticle(data, i, x, y, z, -z * 0.5, 0, x * 0.5);
  }
  return data;
}

// ---------- Disk (Kepler-like 회전) ----------
function generateDisk(n: number): Float32Array {
  const data = alloc(n);
  for (let i = 0; i < n; i++) {
    const r = 0.5 + Math.random() * 1.3;
    const theta = Math.random() * 2 * Math.PI;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * 0.1; // 얇은 disk
    const v = Math.sqrt(0.5 / r); // Kepler v ∝ 1/√r
    setParticle(data, i, x, y, z, -z * v / r, 0, x * v / r);
  }
  return data;
}

// ---------- Two galaxies (충돌) ----------
function generateTwoGalaxies(n: number): Float32Array {
  const data = alloc(n);
  const half = Math.floor(n / 2);
  const c1x = -1.2, c1z = -0.5;
  const c2x =  1.2, c2z =  0.5;
  for (let i = 0; i < n; i++) {
    const inFirst = i < half;
    const cx = inFirst ? c1x : c2x;
    const cz = inFirst ? c1z : c2z;
    const vBaseX = inFirst ? 0.5 : -0.5; // 서로를 향해 이동
    const vBaseZ = inFirst ? 0.2 : -0.2;
    const r = Math.random() * 0.6 + 0.1;
    const theta = Math.random() * 2 * Math.PI;
    const x = cx + r * Math.cos(theta);
    const z = cz + r * Math.sin(theta);
    const y = (Math.random() - 0.5) * 0.3;
    const spinSign = inFirst ? 1 : -1;
    setParticle(
      data, i,
      x, y, z,
      vBaseX + -z * 0.4 * spinSign * (r > 0 ? 1 / Math.max(r, 0.1) : 0),
      0,
      vBaseZ + x * 0.4 * spinSign * (r > 0 ? 1 / Math.max(r, 0.1) : 0),
    );
  }
  return data;
}

// ---------- Random cube (정적) ----------
function generateCube(n: number): Float32Array {
  const data = alloc(n);
  for (let i = 0; i < n; i++) {
    const x = (Math.random() - 0.5) * 3;
    const y = (Math.random() - 0.5) * 3;
    const z = (Math.random() - 0.5) * 3;
    setParticle(data, i, x, y, z, 0, 0, 0);
  }
  return data;
}

export const patterns: InitPattern[] = [
  {
    name: "Sphere",
    description: "회전하는 구형 분포",
    generate: generateSphere,
    defaultG: 0.05,
    defaultSoftening: 0.25,
  },
  {
    name: "Disk",
    description: "얇은 디스크 + Kepler 회전",
    generate: generateDisk,
    defaultG: 0.08,
    defaultSoftening: 0.2,
  },
  {
    name: "Two Galaxies",
    description: "두 클러스터의 정면 충돌",
    generate: generateTwoGalaxies,
    defaultG: 0.06,
    defaultSoftening: 0.22,
  },
  {
    name: "Cube",
    description: "정지 상태 균등 분포 (cold collapse)",
    generate: generateCube,
    defaultG: 0.03,
    defaultSoftening: 0.3,
  },
];

export const PARTICLE_COUNTS = [512, 1024, 2048, 4096, 8192] as const;
