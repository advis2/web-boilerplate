export interface CameraInit {
  distance: number;
  yaw: number;
  pitch: number;
  pointSize: number;
}

export interface Preset {
  name: string;
  description: string;
  code: string;
  camera: CameraInit;
}

export const DEFAULT_CAMERA: CameraInit = {
  distance: 5,
  yaw: 0.4,
  pitch: 0.35,
  pointSize: 0.018,
};

export const PRESET_HEADER = `// 고정 영역 (편집 금지)
struct Particle {
  position : vec3<f32>,
  _p0      : f32,
  velocity : vec3<f32>,
  _p1      : f32,
};

struct Uniforms {
  time   : f32,
  dt     : f32,
  count  : u32,
  _pad   : f32,
};

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform> u : Uniforms;
`;

export const presets: Preset[] = [
  {
    name: "Wave",
    description: "사인파 격자 — y 좌표가 (x, z, t)의 함수",
    camera: { distance: 7, yaw: 0.6, pitch: 0.45, pointSize: 0.018 },
    code: `${PRESET_HEADER}
// === USER KERNEL ===
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let i = gid.x;
  if (i >= u.count) { return; }

  var p = particles[i];

  // 그리드 좌표로 매핑
  let side = 128u;
  let ix = f32(i % side) - f32(side) * 0.5;
  let iz = f32(i / side) - f32(side) * 0.5;

  let x = ix * 0.04;
  let z = iz * 0.04;
  let y = sin(x * 2.0 + u.time) * cos(z * 2.0 + u.time * 0.7) * 1.2;

  p.position = vec3<f32>(x, y, z);
  particles[i] = p;
}
`,
  },
  {
    name: "Spiral Galaxy",
    description: "회전하는 나선 은하 — 각 입자의 각속도가 반지름에 따라 변함",
    camera: { distance: 6, yaw: 0.4, pitch: 0.8, pointSize: 0.014 },
    code: `${PRESET_HEADER}
// === USER KERNEL ===
fn hash(n : u32) -> f32 {
  var x = n;
  x = (x ^ 61u) ^ (x >> 16u);
  x = x + (x << 3u);
  x = x ^ (x >> 4u);
  x = x * 0x27d4eb2du;
  x = x ^ (x >> 15u);
  return f32(x) / 4294967295.0;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let i = gid.x;
  if (i >= u.count) { return; }

  var p = particles[i];

  let r0 = hash(i) * 2.5 + 0.2;
  let a0 = hash(i + 1234u) * 6.2831853;
  let omega = 1.4 / (r0 + 0.3);
  let angle = a0 + u.time * omega;

  let y = (hash(i + 5678u) - 0.5) * 0.3 * exp(-r0 * 0.5);

  p.position = vec3<f32>(cos(angle) * r0, y, sin(angle) * r0);
  particles[i] = p;
}
`,
  },
  {
    name: "Lorenz Attractor",
    description: "카오스 시스템 — dx/dt, dy/dt, dz/dt 미분방정식 적분",
    camera: { distance: 5, yaw: 0.3, pitch: 0.25, pointSize: 0.018 },
    code: `${PRESET_HEADER}
// === USER KERNEL ===
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let i = gid.x;
  if (i >= u.count) { return; }

  var p = particles[i];

  // 첫 프레임 초기화
  if (u.time < 0.05 && length(p.position) < 0.001) {
    let fi = f32(i);
    p.position = vec3<f32>(
      sin(fi * 0.013) * 0.5,
      cos(fi * 0.017) * 0.5 + 0.01,
      sin(fi * 0.019) * 0.5
    );
  }

  // Lorenz parameters
  let sigma = 10.0;
  let rho   = 28.0;
  let beta  = 8.0 / 3.0;

  let pos = p.position;
  let dx = sigma * (pos.y - pos.x);
  let dy = pos.x * (rho - pos.z) - pos.y;
  let dz = pos.x * pos.y - beta * pos.z;

  let dt = u.dt * 0.5;
  let next = pos + vec3<f32>(dx, dy, dz) * dt;

  // 시각화를 위해 축소 + 중앙 정렬
  p.position = next * 0.06 - vec3<f32>(0.0, 1.5, 0.0);
  particles[i] = p;
}
`,
  },
  {
    name: "Gravity Well",
    description: "중력 우물 — velocity를 적분하며 중심으로 끌림",
    camera: { distance: 6, yaw: 0.4, pitch: 0.3, pointSize: 0.02 },
    code: `${PRESET_HEADER}
// === USER KERNEL ===
fn hash(n : u32) -> f32 {
  var x = n;
  x = (x ^ 61u) ^ (x >> 16u);
  x = x + (x << 3u);
  x = x ^ (x >> 4u);
  x = x * 0x27d4eb2du;
  x = x ^ (x >> 15u);
  return f32(x) / 4294967295.0;
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let i = gid.x;
  if (i >= u.count) { return; }

  var p = particles[i];

  // 초기화
  if (u.time < 0.05) {
    let fi = f32(i);
    p.position = vec3<f32>(
      (hash(i) - 0.5) * 4.0,
      (hash(i + 1u) - 0.5) * 4.0,
      (hash(i + 2u) - 0.5) * 4.0
    );
    let tangent = normalize(cross(p.position, vec3<f32>(0.0, 1.0, 0.0)));
    p.velocity = tangent * 1.5;
  }

  // 중력
  let r = length(p.position) + 0.1;
  let force = -p.position / (r * r * r) * 1.5;

  p.velocity = p.velocity + force * u.dt;
  p.position = p.position + p.velocity * u.dt;

  particles[i] = p;
}
`,
  },
];
