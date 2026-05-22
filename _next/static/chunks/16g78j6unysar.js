(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,15883,e=>{"use strict";var t=e.i(92392),r=e.i(94785);let a=`
struct Camera {
  viewProj  : mat4x4<f32>,
  pointSize : f32,
  _pad0 : f32,
  _pad1 : f32,
  _pad2 : f32,
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
`,i=`
struct Particle {
  pos : vec3<f32>,
  _p0 : f32,
  vel : vec3<f32>,
  _p1 : f32,
};

struct Camera {
  viewProj  : mat4x4<f32>,
  pointSize : f32,
  _pad0 : f32,
  _pad1 : f32,
  _pad2 : f32,
};

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<uniform>        cam       : Camera;

struct VOut {
  @builtin(position) pos : vec4<f32>,
  @location(0)       color : vec3<f32>,
  @location(1)       uv : vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vi : u32, @builtin(instance_index) ii : u32) -> VOut {
  var quad = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0, -1.0), vec2<f32>( 1.0,  1.0),
    vec2<f32>(-1.0, -1.0), vec2<f32>( 1.0,  1.0), vec2<f32>(-1.0,  1.0)
  );
  let local = quad[vi];
  let p = particles[ii];
  var clip = cam.viewProj * vec4<f32>(p.pos, 1.0);
  clip = vec4<f32>(
    clip.x + local.x * cam.pointSize * clip.w,
    clip.y + local.y * cam.pointSize * clip.w,
    clip.z, clip.w
  );
  let speed = length(p.vel);
  let col = mix(vec3<f32>(0.3, 0.65, 1.0), vec3<f32>(1.0, 0.55, 0.2), clamp(speed * 0.5, 0.0, 1.0));
  var out: VOut;
  out.pos = clip;
  out.color = col;
  out.uv = local;
  return out;
}

@fragment
fn fs(in : VOut) -> @location(0) vec4<f32> {
  let d = length(in.uv);
  if (d > 1.0) { discard; }
  let alpha = smoothstep(1.0, 0.0, d);
  return vec4<f32>(in.color * alpha, alpha);
}
`;e.s(["default",0,function({module:e,device:n,particleCount:o,dt:l,G:c,softening:u,onStats:s}){let f=(0,r.useRef)(null),p=(0,r.useRef)({dt:l,G:c,softening:u});p.current={dt:l,G:c,softening:u};let d=(0,r.useRef)(s);return d.current=s,(0,r.useEffect)(()=>{let t,r,l=f.current;if(!l)return;let c=!1,u=l.getContext("webgpu");if(!u)return;let s=navigator.gpu.getPreferredCanvasFormat();u.configure({device:n,format:s,alphaMode:"opaque"});let h=e._nbody_get_particle_buffer(),v=e.WebGPU.mgrBuffer.get(h);if(!v)return void console.error("nbody: particleBuffer not found in WebGPU.mgrBuffer");let m=n.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),g=n.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"read-only-storage"}},{binding:1,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),y=n.createBindGroup({layout:g,entries:[{binding:0,resource:{buffer:v}},{binding:1,resource:{buffer:m}}]}),b=n.createShaderModule({code:i}),w=n.createRenderPipeline({layout:n.createPipelineLayout({bindGroupLayouts:[g]}),vertex:{module:b,entryPoint:"vs"},fragment:{module:b,entryPoint:"fs",targets:[{format:s,blend:{color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha"}}}]},primitive:{topology:"triangle-list"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}}),P=function(){let e=[],t=(t,r,a,i,n,o,l,c,u)=>{e.push(t,r,a,l,c,u),e.push(i,n,o,l,c,u)};t(0,0,0,1,0,0,.9,.25,.25),t(0,0,0,0,1,0,.25,.9,.25),t(0,0,0,0,0,1,.25,.4,1),t(-2.5,-2.5,-2.5,2.5,-2.5,-2.5,.32,.32,.32),t(2.5,-2.5,-2.5,2.5,-2.5,2.5,.32,.32,.32),t(2.5,-2.5,2.5,-2.5,-2.5,2.5,.32,.32,.32),t(-2.5,-2.5,2.5,-2.5,-2.5,-2.5,.32,.32,.32),t(-2.5,2.5,-2.5,2.5,2.5,-2.5,.32,.32,.32),t(2.5,2.5,-2.5,2.5,2.5,2.5,.32,.32,.32),t(2.5,2.5,2.5,-2.5,2.5,2.5,.32,.32,.32),t(-2.5,2.5,2.5,-2.5,2.5,-2.5,.32,.32,.32),t(-2.5,-2.5,-2.5,-2.5,2.5,-2.5,.32,.32,.32),t(2.5,-2.5,-2.5,2.5,2.5,-2.5,.32,.32,.32),t(2.5,-2.5,2.5,2.5,2.5,2.5,.32,.32,.32),t(-2.5,-2.5,2.5,-2.5,2.5,2.5,.32,.32,.32);for(let e=0;e<=6;e++){let r=-2.5+5*e/6;t(-2.5,-2.5,r,2.5,-2.5,r,.18,.18,.18),t(r,-2.5,-2.5,r,-2.5,2.5,.18,.18,.18)}let r=new Float32Array(e.length);return r.set(e),r}(),M=n.createBuffer({size:P.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});n.queue.writeBuffer(M,0,P.buffer,P.byteOffset,P.byteLength);let x=P.length/6,S=n.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),E=n.createBindGroup({layout:S,entries:[{binding:0,resource:{buffer:m}}]}),B=n.createShaderModule({code:a}),G=n.createRenderPipeline({layout:n.createPipelineLayout({bindGroupLayouts:[S]}),vertex:{module:B,entryPoint:"vs",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:B,entryPoint:"fs",targets:[{format:s}]},primitive:{topology:"line-list"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}}),L={yaw:Math.PI/4,pitch:Math.atan(1/Math.SQRT2),distance:8,pointSize:.014},_=e=>{T=!0,U=e.clientX,V=e.clientY,l.setPointerCapture(e.pointerId)},C=e=>{if(!T)return;let t=e.clientX-U,r=e.clientY-V;U=e.clientX,V=e.clientY,L.yaw+=.005*t,L.pitch=Math.max(-1.4,Math.min(1.4,L.pitch+.005*r))},O=e=>{T=!1,l.releasePointerCapture(e.pointerId)},R=e=>{e.preventDefault(),L.distance=Math.max(2.5*Math.sqrt(3)+.5,Math.min(50,L.distance*(1+.001*e.deltaY)))},T=!1,U=0,V=0;l.addEventListener("pointerdown",_),l.addEventListener("pointermove",C),l.addEventListener("pointerup",O),l.addEventListener("wheel",R,{passive:!1});let A=0,F=performance.now(),z=0,q=()=>{var a,i;let s,f;if(c)return;let h=Math.min(window.devicePixelRatio||1,2),v=Math.max(1,Math.floor((l.clientWidth||800)*h)),g=Math.max(1,Math.floor((l.clientHeight||600)*h));(l.width!==v||l.height!==g)&&(l.width=v,l.height=g),r&&r.width===v&&r.height===g||(r?.destroy(),r=n.createTexture({size:[v,g],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));let b=performance.now();e._nbody_step(p.current.dt,p.current.G,p.current.softening);let P=performance.now();z+=P-b;let S=2.5*Math.SQRT2*1.3,B=Math.max(.1,L.distance-S),_=L.distance+3*S,C=function(e,t){let r=new Float32Array(16);for(let a=0;a<4;a++)for(let i=0;i<4;i++)r[4*a+i]=e[0+i]*t[4*a+0]+e[4+i]*t[4*a+1]+e[8+i]*t[4*a+2]+e[12+i]*t[4*a+3];return r}((a=Math.PI/3,i=v/g,s=1/Math.tan(a/2),(f=new Float32Array(16))[0]=s/i,f[5]=s,f[10]=_/(B-_),f[11]=-1,f[14]=B*_/(B-_),f),function(e,t,r){let[a,i,n]=e,[o,l,c]=t,u=o-a,s=l-i,f=c-n,p=Math.hypot(u,s,f);u/=p,s/=p;let d=s*r[2]-(f/=p)*r[1],h=f*r[0]-u*r[2],v=u*r[1]-s*r[0],m=Math.hypot(d,h,v);d/=m;let g=(h/=m)*f-(v/=m)*s,y=v*u-d*f,b=d*s-h*u,w=new Float32Array(16);return w[0]=d,w[1]=g,w[2]=-u,w[3]=0,w[4]=h,w[5]=y,w[6]=-s,w[7]=0,w[8]=v,w[9]=b,w[10]=-f,w[11]=0,w[12]=-(d*a+h*i+v*n),w[13]=-(g*a+y*i+b*n),w[14]=u*a+s*i+f*n,w[15]=1,w}([Math.cos(L.pitch)*Math.sin(L.yaw)*L.distance,Math.sin(L.pitch)*L.distance,Math.cos(L.pitch)*Math.cos(L.yaw)*L.distance],[0,0,0],[0,1,0])),O=new Float32Array(20);O.set(C,0),O[16]=L.pointSize,n.queue.writeBuffer(m,0,O);let R=n.createCommandEncoder(),T=u.getCurrentTexture().createView(),U=R.beginRenderPass({colorAttachments:[{view:T,clearValue:{r:.03,g:.05,b:.12,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:r.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});U.setPipeline(G),U.setBindGroup(0,E),U.setVertexBuffer(0,M),U.draw(x),U.setPipeline(w),U.setBindGroup(0,y),U.draw(6,o),U.end(),n.queue.submit([R.finish()]),A++;let V=performance.now();if(V-F>=500){let e=Math.round(1e3*A/(V-F)),t=z/A;d.current?.({fps:e,stepMs:t}),A=0,z=0,F=V}t=requestAnimationFrame(q)};return t=requestAnimationFrame(q),()=>{c=!0,void 0!==t&&cancelAnimationFrame(t),l.removeEventListener("pointerdown",_),l.removeEventListener("pointermove",C),l.removeEventListener("pointerup",O),l.removeEventListener("wheel",R),r?.destroy()}},[e,n,o]),(0,t.jsx)("canvas",{ref:f,style:{width:"100%",height:"100%",display:"block",background:"#000",cursor:"grab"}})}])},12710,e=>{e.n(e.i(15883))}]);