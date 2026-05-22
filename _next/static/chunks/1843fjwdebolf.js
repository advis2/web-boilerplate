(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,33587,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"BailoutToCSR",{enumerable:!0,get:function(){return n}});let r=e.r(86851);function n({reason:e,children:t}){if("u"<typeof window)throw Object.defineProperty(new r.BailoutToCSRError(e),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0});return t}},23288,(e,t,i)=>{"use strict";function r(e){return e.split("/").map(e=>encodeURIComponent(e)).join("/")}Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"encodeURIPath",{enumerable:!0,get:function(){return r}})},85427,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"PreloadChunks",{enumerable:!0,get:function(){return s}});let r=e.r(92392),n=e.r(15113),o=e.r(94672),l=e.r(23288),a=e.r(70275);function s({moduleIds:e}){if("u">typeof window)return null;let t=o.workAsyncStorage.getStore();if(void 0===t)return null;let i=[];if(t.reactLoadableManifest&&e){let r=t.reactLoadableManifest;for(let t of e){if(!r[t])continue;let e=r[t].files;i.push(...e)}}if(0===i.length)return null;let d=(0,a.getAssetTokenQuery)();return(0,r.jsx)(r.Fragment,{children:i.map(e=>{let i=`${t.assetPrefix}/_next/${(0,l.encodeURIPath)(e)}${d}`;return e.endsWith(".css")?(0,r.jsx)("link",{precedence:"dynamic",href:i,rel:"stylesheet",as:"style",nonce:t.nonce},e):((0,n.preload)(i,{as:"script",fetchPriority:"low",nonce:t.nonce}),null)})})}},67026,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"default",{enumerable:!0,get:function(){return d}});let r=e.r(92392),n=e.r(94785),o=e.r(33587),l=e.r(85427);function a(e){return{default:e&&"default"in e?e.default:e}}let s={loader:()=>Promise.resolve(a(()=>null)),loading:null,ssr:!0},d=function(e){let t={...s,...e},i=(0,n.lazy)(()=>t.loader().then(a)),d=t.loading;function u(e){let a=d?(0,r.jsx)(d,{isLoading:!0,pastDelay:!0,error:null}):null,s=!t.ssr||!!t.loading,u=s?n.Suspense:n.Fragment,c=t.ssr?(0,r.jsxs)(r.Fragment,{children:["u"<typeof window?(0,r.jsx)(l.PreloadChunks,{moduleIds:t.modules}):null,(0,r.jsx)(i,{...e})]}):(0,r.jsx)(o.BailoutToCSR,{reason:"next/dynamic",children:(0,r.jsx)(i,{...e})});return(0,r.jsx)(u,{...s?{fallback:a}:{},children:c})}return u.displayName="LoadableComponent",u}},56590,(e,t,i)=>{"use strict";Object.defineProperty(i,"__esModule",{value:!0}),Object.defineProperty(i,"default",{enumerable:!0,get:function(){return n}});let r=e.r(81258)._(e.r(67026));function n(e,t){let i={};"function"==typeof e&&(i.loader=e);let n={...i,...t};return(0,r.default)({...n,modules:n.loadableGenerated?.modules})}("function"==typeof i.default||"object"==typeof i.default&&null!==i.default)&&void 0===i.default.__esModule&&(Object.defineProperty(i.default,"__esModule",{value:!0}),Object.assign(i.default,i),t.exports=i.default)},11271,e=>{"use strict";var t=e.i(92392),i=e.i(94785),r=e.i(56590);let n=Math.PI/4,o=Math.atan(1/Math.SQRT2),l=`// 고정 영역 (편집 금지)
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
`,a=[{name:"Wave",description:"사인파 격자 — y 좌표가 (x, z, t)의 함수",camera:{distance:9,yaw:n,pitch:o,pointSize:.018},code:`${l}
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
`},{name:"Spiral Galaxy",description:"회전하는 나선 은하 — 각 입자의 각속도가 반지름에 따라 변함",camera:{distance:9,yaw:n,pitch:o,pointSize:.014},code:`${l}
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
`},{name:"Lorenz Attractor",description:"카오스 시스템 — dx/dt, dy/dt, dz/dt 미분방정식 적분",camera:{distance:9,yaw:n,pitch:o,pointSize:.018},code:`${l}
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
`},{name:"Gravity Well",description:"중력 우물 — velocity를 적분하며 중심으로 끌림",camera:{distance:9,yaw:n,pitch:o,pointSize:.02},code:`${l}
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
`}],s=(0,r.default)(()=>e.A(38438),{loadableGenerated:{modules:[72680]},ssr:!1}),d=(0,r.default)(()=>e.A(93829),{loadableGenerated:{modules:[8772]},ssr:!1});function u({presetIdx:e,onPreset:i,onResetView:r}){return(0,t.jsxs)("header",{style:{padding:"0.75rem 1.25rem",borderBottom:"1px solid #1e293b",background:"#0f172a",display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap"},children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h1",{style:{margin:0,fontSize:"1.05rem",fontWeight:600,color:"#f1f5f9"},children:"GPU Compute Playground"}),(0,t.jsx)("p",{style:{margin:"0.15rem 0 0",fontSize:"0.78rem",color:"#94a3b8"},children:"WebGPU 기반 — CUDA 커널과 동일한 SIMT 모델 (WGSL). 코드 수정 시 ~300ms 후 실시간 반영."})]}),(0,t.jsxs)("div",{style:{marginLeft:"auto",display:"flex",gap:"0.4rem",flexWrap:"wrap"},children:[a.map((r,n)=>(0,t.jsx)("button",{onClick:()=>i(n),style:{padding:"0.4rem 0.85rem",background:n===e?"#0f766e":"#1e293b",color:n===e?"#fff":"#cbd5e1",border:"1px solid #334155",borderRadius:"6px",fontSize:"0.82rem",cursor:"pointer",transition:"all 120ms"},title:r.description,children:r.name},r.name)),(0,t.jsx)("button",{onClick:r,style:{marginLeft:"0.4rem",padding:"0.4rem 0.85rem",background:"transparent",color:"#94a3b8",border:"1px solid #334155",borderRadius:"6px",fontSize:"0.82rem",cursor:"pointer"},title:"현재 preset의 기본 카메라 위치로 복원",children:"↺ Reset View"})]})]})}function c({code:e,onChange:i,error:r}){return(0,t.jsxs)("div",{style:{flex:"0 0 48%",display:"flex",flexDirection:"column",borderRight:"1px solid #1e293b",minWidth:0},children:[(0,t.jsx)("div",{style:{flex:1,minHeight:0},children:(0,t.jsx)(s,{height:"100%",defaultLanguage:"rust",language:"rust",theme:"vs-dark",value:e,onChange:e=>i(e??""),options:{fontSize:13,minimap:{enabled:!1},scrollBeyondLastLine:!1,wordWrap:"off",tabSize:2,renderWhitespace:"selection",automaticLayout:!0}})}),(0,t.jsx)(p,{error:r})]})}function p({error:e}){return e?(0,t.jsxs)("div",{style:{padding:"0.6rem 0.85rem",background:"#3f1d2e",borderTop:"1px solid #7f1d1d",color:"#fda4af",fontSize:"0.78rem",fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",whiteSpace:"pre-wrap",maxHeight:"140px",overflowY:"auto"},children:["✗ ",e]}):(0,t.jsx)("div",{style:{padding:"0.45rem 0.85rem",background:"#0f172a",borderTop:"1px solid #1e293b",color:"#64748b",fontSize:"0.78rem",fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace"},children:"✓ compiled"})}function f({shaderCode:e,cameraInit:i,resetSerial:r,onError:n,onUnsupported:o,unsupported:l}){return(0,t.jsxs)("div",{style:{flex:1,position:"relative",minWidth:0,background:"#0f172a"},children:[l?(0,t.jsx)(m,{}):(0,t.jsx)(d,{shaderCode:e,cameraInit:i,resetSerial:r,onError:n,onUnsupported:o}),(0,t.jsx)(x,{})]})}function m(){return(0,t.jsxs)("div",{style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"0.75rem",padding:"2rem",textAlign:"center"},children:[(0,t.jsx)("div",{style:{fontSize:"2.5rem"},children:"⚠"}),(0,t.jsx)("h2",{style:{margin:0,color:"#f1f5f9"},children:"WebGPU 미지원 브라우저"}),(0,t.jsx)("p",{style:{margin:0,color:"#94a3b8",maxWidth:480},children:"이 데모는 WebGPU API를 사용합니다. Chrome / Edge 113+, Safari 26.1+, Firefox 141+ (또는 별도 활성화) 에서 동작합니다."})]})}function x(){return(0,t.jsx)("div",{style:{position:"absolute",bottom:"0.75rem",right:"0.75rem",background:"rgba(15, 23, 42, 0.85)",border:"1px solid #1e293b",borderRadius:"6px",padding:"0.4rem 0.7rem",color:"#94a3b8",fontSize:"0.72rem",fontFamily:"ui-monospace, monospace",pointerEvents:"none"},children:"drag · wheel · 16,384 particles"})}e.s(["default",0,function(){let[e,r]=(0,i.useState)(0),[n,o]=(0,i.useState)(a[0].code),[l,s]=(0,i.useState)(a[0].code),[d,p]=(0,i.useState)(null),[m,x]=(0,i.useState)(!1),[g,h]=(0,i.useState)(0);(0,i.useEffect)(()=>{let e=setTimeout(()=>s(n),300);return()=>clearTimeout(e)},[n]);let b=(0,i.useCallback)(e=>{r(e),o(a[e].code),h(e=>e+1)},[]),y=(0,i.useCallback)(()=>{h(e=>e+1)},[]),v=(0,i.useCallback)(e=>p(e),[]),j=(0,i.useCallback)(()=>x(!0),[]);return(0,t.jsxs)("div",{style:{display:"flex",flexDirection:"column",height:"calc(100vh - 90px)",margin:"-20px",background:"#0b1220",color:"#e2e8f0"},children:[(0,t.jsx)(u,{presetIdx:e,onPreset:b,onResetView:y}),(0,t.jsxs)("div",{style:{flex:1,display:"flex",minHeight:0},children:[(0,t.jsx)(c,{code:n,onChange:o,error:d}),(0,t.jsx)(f,{shaderCode:l,cameraInit:a[e].camera,resetSerial:g,onError:v,onUnsupported:j,unsupported:m})]})]})}],11271)},38438,e=>{e.v(t=>Promise.all(["static/chunks/0.~pixso4_2zb.js"].map(t=>e.l(t))).then(()=>t(72680)))},93829,e=>{e.v(t=>Promise.all(["static/chunks/0b..rcc63redc.js"].map(t=>e.l(t))).then(()=>t(8772)))}]);