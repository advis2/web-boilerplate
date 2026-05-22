(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,46976,e=>{"use strict";var t=e.i(92392),r=e.i(94785);let i=`
struct Camera {
  viewProj  : mat4x4<f32>,
  pointSize : f32,
  _pad0     : f32,
  _pad1     : f32,
  _pad2     : f32,
};

@group(0) @binding(0) var<uniform> cam : Camera;

struct VOut {
  @builtin(position) pos   : vec4<f32>,
  @location(0)       color : vec3<f32>,
};

@vertex
fn vs(@location(0) pos : vec3<f32>, @location(1) col : vec3<f32>) -> VOut {
  var out : VOut;
  out.pos   = cam.viewProj * vec4<f32>(pos, 1.0);
  out.color = col;
  return out;
}

@fragment
fn fs(in : VOut) -> @location(0) vec4<f32> {
  return vec4<f32>(in.color, 1.0);
}
`,n=`
struct Particle {
  position : vec3<f32>,
  _p0      : f32,
  velocity : vec3<f32>,
  _p1      : f32,
};

struct Camera {
  viewProj  : mat4x4<f32>,
  pointSize : f32,
  _pad0     : f32,
  _pad1     : f32,
  _pad2     : f32,
};

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<uniform>        cam       : Camera;

struct VOut {
  @builtin(position) pos   : vec4<f32>,
  @location(0)       color : vec3<f32>,
  @location(1)       uv    : vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> VOut {
  var quad = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0),
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0,  1.0), vec2<f32>(-1.0,  1.0)
  );
  let local = quad[vi];

  let p   = particles[ii];
  var clip = cam.viewProj * vec4<f32>(p.position, 1.0);
  clip = vec4<f32>(
    clip.x + local.x * cam.pointSize * clip.w,
    clip.y + local.y * cam.pointSize * clip.w,
    clip.z,
    clip.w
  );

  let speed = length(p.velocity);
  let col = mix(vec3<f32>(0.25, 0.62, 1.0), vec3<f32>(1.0, 0.5, 0.25), clamp(speed * 0.4, 0.0, 1.0));

  var out : VOut;
  out.pos   = clip;
  out.color = col;
  out.uv    = local;
  return out;
}

@fragment
fn fs(in : VOut) -> @location(0) vec4<f32> {
  let d = length(in.uv);
  if (d > 1.0) { discard; }
  let alpha = smoothstep(1.0, 0.0, d);
  return vec4<f32>(in.color * alpha, alpha);
}
`;async function a(e,t,r){let i=e.device,n=e.computeBGL;if(i&&n)try{i.pushErrorScope("validation");let a=i.createShaderModule({code:t}),o=(await a.getCompilationInfo()).messages.filter(e=>"error"===e.type);if(o.length>0){let e=o.map(e=>`line ${e.lineNum}:${e.linePos}  ${e.message}`).join("\n");r(e),i.popErrorScope().catch(e=>console.warn("popErrorScope:",e));return}let u=i.createPipelineLayout({bindGroupLayouts:[n]}),c=i.createComputePipeline({layout:u,compute:{module:a,entryPoint:"main"}}),l=await i.popErrorScope();if(l)return void r(l.message);e.computePipeline=c,e.resetTime=!0,r(null)}catch(e){r(String(e?.message??e))}}function o(e,t){let r=Math.min(window.devicePixelRatio||1,2),i=t.clientWidth||t.getBoundingClientRect().width||800,n=t.clientHeight||t.getBoundingClientRect().height||600,a=Math.max(1,Math.floor(i*r)),o=Math.max(1,Math.floor(n*r));t.width===a&&t.height===o&&e.depthTex||(t.width=a,t.height=o,e.device&&(e.depthTex?.destroy(),e.depthTex=e.device.createTexture({size:[a,o],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT})))}function u(e,t,r){if(!e)return;let i=e.dataset.status?JSON.parse(e.dataset.status):{};i[t]=r,e.dataset.status=JSON.stringify(i),e.textContent=Object.entries(i).map(([e,t])=>`${e}: ${t}`).join("  ·  ")}e.s(["default",0,function({shaderCode:e,cameraInit:c,resetSerial:l,onError:s,onUnsupported:p}){let d=(0,r.useRef)(null),f=(0,r.useRef)(null),m=(0,r.useRef)(e),h=(0,r.useRef)(c);h.current=c;let v=(0,r.useRef)({startTime:0,lastTime:0,yaw:c.yaw,pitch:c.pitch,distance:c.distance,pointSize:c.pointSize,resetTime:!1});return(0,r.useEffect)(()=>{m.current=e;let t=v.current;t.device&&t.computeBGL&&a(t,e,s)},[e,s]),(0,r.useEffect)(()=>{let e=v.current;e.yaw=c.yaw,e.pitch=c.pitch,e.distance=c.distance},[l,c]),(0,r.useEffect)(()=>{let e=!1;(async()=>{let t=d.current;if(!t)return;if(u(f.current,"init","requesting adapter…"),!navigator.gpu)return void p();let r=await navigator.gpu.requestAdapter();if(!r)return void p();u(f.current,"init","requesting device…");let c=await r.requestDevice();if(e)return;c.lost.then(t=>{e||s(`GPU device lost: ${t.message}`)}),c.addEventListener("uncapturederror",e=>{s(`uncaptured: ${e.error.message}`)});let l=t.getContext("webgpu");if(!l)return void s("canvas.getContext('webgpu') returned null");let g=navigator.gpu.getPreferredCanvasFormat();l.configure({device:c,format:g,alphaMode:"opaque"}),u(f.current,"init","device ok");let y=new Float32Array(131072);for(let e=0;e<16384;e++)y[8*e+0]=e%128*.04-2.56,y[8*e+1]=0,y[8*e+2]=.04*Math.floor(e/128)-2.56;let b=c.createBuffer({size:y.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});c.queue.writeBuffer(b,0,y);let P=c.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),w=c.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),B=c.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}}]}),x=c.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),S=c.createBindGroup({layout:B,entries:[{binding:0,resource:{buffer:b}},{binding:1,resource:{buffer:P}}]}),G=c.createBindGroup({layout:x,entries:[{binding:0,resource:{buffer:b}},{binding:1,resource:{buffer:w}}]}),T=c.createShaderModule({code:n}),M=c.createPipelineLayout({bindGroupLayouts:[x]}),E=c.createRenderPipeline({layout:M,vertex:{module:T,entryPoint:"vs"},fragment:{module:T,entryPoint:"fs",targets:[{format:g,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}}),C=function(){let e=[],t=(t,r,i,n,a,o,u,c,l)=>{e.push(t,r,i,u,c,l),e.push(n,a,o,u,c,l)};t(0,0,0,1.2000000000000002,0,0,.9,.25,.25),t(0,0,0,0,1.2000000000000002,0,.25,.9,.25),t(0,0,0,0,0,1.2000000000000002,.25,.4,1),t(-3,-3,-3,3,-3,-3,.32,.32,.32),t(3,-3,-3,3,-3,3,.32,.32,.32),t(3,-3,3,-3,-3,3,.32,.32,.32),t(-3,-3,3,-3,-3,-3,.32,.32,.32),t(-3,3,-3,3,3,-3,.32,.32,.32),t(3,3,-3,3,3,3,.32,.32,.32),t(3,3,3,-3,3,3,.32,.32,.32),t(-3,3,3,-3,3,-3,.32,.32,.32),t(-3,-3,-3,-3,3,-3,.32,.32,.32),t(3,-3,-3,3,3,-3,.32,.32,.32),t(3,-3,3,3,3,3,.32,.32,.32),t(-3,-3,3,-3,3,3,.32,.32,.32);for(let e=0;e<=6;e++){let r=-3+6*e/6;t(-3,-3,r,3,-3,r,.18,.18,.18),t(r,-3,-3,r,-3,3,.18,.18,.18)}let r=new Float32Array(e.length);return r.set(e),r}(),U=c.createBuffer({size:C.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});c.queue.writeBuffer(U,0,C.buffer,C.byteOffset,C.byteLength);let O=c.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),L=c.createBindGroup({layout:O,entries:[{binding:0,resource:{buffer:w}}]}),R=c.createShaderModule({code:i}),V=c.createPipelineLayout({bindGroupLayouts:[O]}),F=c.createRenderPipeline({layout:V,vertex:{module:R,entryPoint:"vs",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:R,entryPoint:"fs",targets:[{format:g}]},primitive:{topology:"line-list"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}}),A=v.current;A.device=c,A.context=l,A.format=g,A.particleBuf=b,A.uniformBuf=P,A.cameraBuf=w,A.computeBGL=B,A.renderBGL=x,A.computeBindGroup=S,A.renderPipeline=E,A.renderBindGroup=G,A.linePipeline=F,A.lineBindGroup=L,A.lineVertexBuf=U,A.lineVertexCount=C.length/6,A.startTime=performance.now(),A.lastTime=A.startTime,o(A,t),a(A,m.current,s);let z=0,q=performance.now(),_=()=>{if(e)return;A.pointSize=h.current.pointSize,function(e,t){let r,i,{device:n,context:a,uniformBuf:u,cameraBuf:c,depthTex:l}=e;if(!n||!a||!u||!c||!l)return;o(e,t);let s=performance.now();e.resetTime&&(e.startTime=s,e.lastTime=s,e.resetTime=!1);let p=(s-e.startTime)/1e3,d=Math.min(.05,(s-e.lastTime)/1e3);e.lastTime=s;let f=new ArrayBuffer(16);new Float32Array(f,0,1)[0]=p,new Float32Array(f,4,1)[0]=d,new Uint32Array(f,8,1)[0]=16384,n.queue.writeBuffer(u,0,f);let m=t.width/t.height,h=3*Math.SQRT2*1.3,v=Math.max(.1,e.distance-h),g=e.distance+3*h,y=function(e,t){let r=new Float32Array(16);for(let i=0;i<4;i++)for(let n=0;n<4;n++)r[4*i+n]=e[0+n]*t[4*i+0]+e[4+n]*t[4*i+1]+e[8+n]*t[4*i+2]+e[12+n]*t[4*i+3];return r}((r=1/Math.tan(Math.PI/3/2),(i=new Float32Array(16))[0]=r/m,i[5]=r,i[10]=g/(v-g),i[11]=-1,i[14]=v*g/(v-g),i),function(e,t,r){let[i,n,a]=e,[o,u,c]=t,l=o-i,s=u-n,p=c-a,d=Math.hypot(l,s,p);l/=d,s/=d;let f=s*r[2]-(p/=d)*r[1],m=p*r[0]-l*r[2],h=l*r[1]-s*r[0],v=Math.hypot(f,m,h);f/=v;let g=(m/=v)*p-(h/=v)*s,y=h*l-f*p,b=f*s-m*l,P=new Float32Array(16);return P[0]=f,P[1]=g,P[2]=-l,P[3]=0,P[4]=m,P[5]=y,P[6]=-s,P[7]=0,P[8]=h,P[9]=b,P[10]=-p,P[11]=0,P[12]=-(f*i+m*n+h*a),P[13]=-(g*i+y*n+b*a),P[14]=l*i+s*n+p*a,P[15]=1,P}([Math.cos(e.pitch)*Math.sin(e.yaw)*e.distance,Math.sin(e.pitch)*e.distance,Math.cos(e.pitch)*Math.cos(e.yaw)*e.distance],[0,0,0],[0,1,0])),b=new Float32Array(20);b.set(y,0),b[16]=e.pointSize,n.queue.writeBuffer(c,0,b);let P=n.createCommandEncoder();if(e.computePipeline&&e.computeBindGroup){let t=P.beginComputePass();t.setPipeline(e.computePipeline),t.setBindGroup(0,e.computeBindGroup),t.dispatchWorkgroups(Math.ceil(256)),t.end()}let w=a.getCurrentTexture().createView(),B=P.beginRenderPass({colorAttachments:[{view:w,clearValue:{r:.03,g:.05,b:.12,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:l.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});e.linePipeline&&e.lineBindGroup&&e.lineVertexBuf&&e.lineVertexCount&&(B.setPipeline(e.linePipeline),B.setBindGroup(0,e.lineBindGroup),B.setVertexBuffer(0,e.lineVertexBuf),B.draw(e.lineVertexCount)),e.renderPipeline&&e.renderBindGroup&&(B.setPipeline(e.renderPipeline),B.setBindGroup(0,e.renderBindGroup),B.draw(6,16384)),B.end(),n.queue.submit([P.finish()])}(A,t),z++;let r=performance.now();if(r-q>=500){let e=Math.round(1e3*z/(r-q));u(f.current,"fps",String(e)),u(f.current,"size",`${t.width}\xd7${t.height}`),u(f.current,"cam",`d=${A.distance.toFixed(1)} y=${(180*A.yaw/Math.PI).toFixed(0)}\xb0 p=${(180*A.pitch/Math.PI).toFixed(0)}\xb0`),z=0,q=r}A.rafId=requestAnimationFrame(_)};A.rafId=requestAnimationFrame(_)})().catch(e=>{console.error(e),s(String(e?.message??e))});let t=d.current,r=null;t&&"u">typeof ResizeObserver&&(r=new ResizeObserver(()=>o(v.current,t))).observe(t);let c=d.current,l=!1,g=0,y=0,b=e=>{l=!0,g=e.clientX,y=e.clientY,c?.setPointerCapture(e.pointerId)},P=e=>{if(!l)return;let t=e.clientX-g,r=e.clientY-y;g=e.clientX,y=e.clientY;let i=v.current;i.yaw+=.005*t,i.pitch=Math.max(-1.4,Math.min(1.4,i.pitch+.005*r))},w=e=>{l=!1,c?.releasePointerCapture(e.pointerId)},B=e=>{e.preventDefault();let t=v.current;t.distance=Math.max(3*Math.sqrt(3)+.5,Math.min(50,t.distance*(1+.001*e.deltaY)))};return c?.addEventListener("pointerdown",b),c?.addEventListener("pointermove",P),c?.addEventListener("pointerup",w),c?.addEventListener("wheel",B,{passive:!1}),()=>{e=!0;let t=v.current;t.rafId&&cancelAnimationFrame(t.rafId),r?.disconnect(),c?.removeEventListener("pointerdown",b),c?.removeEventListener("pointermove",P),c?.removeEventListener("pointerup",w),c?.removeEventListener("wheel",B)}},[s,p]),(0,t.jsxs)("div",{style:{position:"absolute",inset:0},children:[(0,t.jsx)("canvas",{ref:d,style:{width:"100%",height:"100%",display:"block",background:"#000",cursor:"grab"}}),(0,t.jsx)("div",{ref:f,style:{position:"absolute",top:"0.5rem",left:"0.5rem",padding:"0.3rem 0.55rem",background:"rgba(15, 23, 42, 0.85)",border:"1px solid #1e293b",borderRadius:"6px",color:"#94a3b8",fontSize:"0.7rem",fontFamily:"ui-monospace, monospace",pointerEvents:"none"},children:"init: waiting…"})]})}])},8772,e=>{e.n(e.i(46976))}]);