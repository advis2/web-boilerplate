(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,39534,e=>{"use strict";var t=e.i(92392),r=e.i(94785);let a=`
struct Camera {
  viewProj : mat4x4<f32>,
  lightDir : vec3<f32>,
  _pad     : f32,
};

@group(0) @binding(0) var<uniform> cam : Camera;

struct VIn {
  @location(0) pos    : vec3<f32>,
  @location(1) normal : vec3<f32>,
};

struct VOut {
  @builtin(position) clipPos     : vec4<f32>,
  @location(0)       worldNormal : vec3<f32>,
};

@vertex
fn vs(in : VIn) -> VOut {
  var out : VOut;
  out.clipPos     = cam.viewProj * vec4<f32>(in.pos, 1.0);
  out.worldNormal = in.normal;
  return out;
}

@fragment
fn fs(in : VOut) -> @location(0) vec4<f32> {
  let n = normalize(in.worldNormal);
  let l = normalize(cam.lightDir);
  let diffuse = max(dot(n, l), 0.0);
  let ambient = 0.22;
  let intensity = ambient + diffuse * 0.78;
  let baseColor = vec3<f32>(0.45, 0.72, 1.0);
  return vec4<f32>(baseColor * intensity, 1.0);
}
`,n=`
struct Camera {
  viewProj : mat4x4<f32>,
  lightDir : vec3<f32>,
  _pad     : f32,
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
`;e.s(["default",0,function({module:e,device:o,amplitude:i,frequency:l,wireframe:u,paused:s,onStats:f}){let c=(0,r.useRef)(null),d=(0,r.useRef)({amplitude:i,frequency:l,wireframe:u,paused:s});d.current={amplitude:i,frequency:l,wireframe:u,paused:s};let p=(0,r.useRef)(f);return p.current=f,(0,r.useEffect)(()=>{let t,r,i=c.current;if(!i)return;let l=!1,u=i.getContext("webgpu");if(!u)return;let s=navigator.gpu.getPreferredCanvasFormat();u.configure({device:o,format:s,alphaMode:"opaque"});let f=e._mesh_get_vertex_buffer(),h=e._mesh_get_index_buffer(),m=e._mesh_get_index_count(),v=e.WebGPU.mgrBuffer.get(f),g=e.WebGPU.mgrBuffer.get(h);if(!v||!g)return void console.error("mesh: vertex or index buffer not found");let y=o.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),b=o.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]}),w=o.createBindGroup({layout:b,entries:[{binding:0,resource:{buffer:y}}]}),P=o.createShaderModule({code:a}),M=o.createPipelineLayout({bindGroupLayouts:[b]}),x={arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:16,format:"float32x3"}]},C=o.createRenderPipeline({layout:M,vertex:{module:P,entryPoint:"vs",buffers:[x]},fragment:{module:P,entryPoint:"fs",targets:[{format:s}]},primitive:{topology:"triangle-list",cullMode:"back"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}}),E=o.createRenderPipeline({layout:M,vertex:{module:P,entryPoint:"vs",buffers:[x]},fragment:{module:P,entryPoint:"fs",targets:[{format:s}]},primitive:{topology:"line-list"},depthStencil:{format:"depth24plus",depthWriteEnabled:!1,depthCompare:"less-equal"}}),B=function(){let e=[],t=(t,r,a,n,o,i,l,u,s)=>{e.push(t,r,a,l,u,s,n,o,i,l,u,s)};t(0,0,0,.8,0,0,.9,.25,.25),t(0,0,0,0,.8,0,.25,.9,.25),t(0,0,0,0,0,.8,.25,.4,1),t(-2,-2,-2,2,-2,-2,.32,.32,.32),t(2,-2,-2,2,-2,2,.32,.32,.32),t(2,-2,2,-2,-2,2,.32,.32,.32),t(-2,-2,2,-2,-2,-2,.32,.32,.32),t(-2,2,-2,2,2,-2,.32,.32,.32),t(2,2,-2,2,2,2,.32,.32,.32),t(2,2,2,-2,2,2,.32,.32,.32),t(-2,2,2,-2,2,-2,.32,.32,.32),t(-2,-2,-2,-2,2,-2,.32,.32,.32),t(2,-2,-2,2,2,-2,.32,.32,.32),t(2,-2,2,2,2,2,.32,.32,.32),t(-2,-2,2,-2,2,2,.32,.32,.32);for(let e=0;e<=6;e++){let r=-2+4*e/6;t(-2,-2,r,2,-2,r,.18,.18,.18),t(r,-2,-2,r,-2,2,.18,.18,.18)}let r=new Float32Array(e.length);return r.set(e),r}(),_=o.createBuffer({size:B.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});o.queue.writeBuffer(_,0,B.buffer,B.byteOffset,B.byteLength);let L=B.length/6,O=o.createShaderModule({code:n}),R=o.createRenderPipeline({layout:M,vertex:{module:O,entryPoint:"vs",buffers:[{arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]}]},fragment:{module:O,entryPoint:"fs",targets:[{format:s}]},primitive:{topology:"line-list"},depthStencil:{format:"depth24plus",depthWriteEnabled:!0,depthCompare:"less"}}),S={yaw:Math.PI/4,pitch:Math.atan(1/Math.SQRT2),distance:5},V=!1,T=0,U=0,A=e=>{V=!0,T=e.clientX,U=e.clientY,i.setPointerCapture(e.pointerId)},G=e=>{V&&(S.yaw+=(e.clientX-T)*.005,S.pitch=Math.max(-1.4,Math.min(1.4,S.pitch+(e.clientY-U)*.005)),T=e.clientX,U=e.clientY)},F=e=>{V=!1,i.releasePointerCapture(e.pointerId)},q=e=>{e.preventDefault(),S.distance=Math.max(2*Math.sqrt(3)+.3,Math.min(30,S.distance*(1+.001*e.deltaY)))};i.addEventListener("pointerdown",A),i.addEventListener("pointermove",G),i.addEventListener("pointerup",F),i.addEventListener("wheel",q,{passive:!1});let I=0,D=performance.now(),N=0,j=performance.now(),W=()=>{var a,n;let s,f;if(l)return;let c=Math.min(window.devicePixelRatio||1,2),h=Math.max(1,Math.floor((i.clientWidth||800)*c)),b=Math.max(1,Math.floor((i.clientHeight||600)*c));(i.width!==h||i.height!==b)&&(i.width=h,i.height=b),r&&r.width===h&&r.height===b||(r?.destroy(),r=o.createTexture({size:[h,b],format:"depth24plus",usage:GPUTextureUsage.RENDER_ATTACHMENT}));let P=(performance.now()-j)/1e3,M=performance.now();d.current.paused||e._mesh_step(P,d.current.amplitude,d.current.frequency);let x=performance.now();N+=x-M;let B=2*Math.SQRT2*1.3,O=Math.max(.1,S.distance-B),V=S.distance+3*B,T=function(e,t){let r=new Float32Array(16);for(let a=0;a<4;a++)for(let n=0;n<4;n++)r[4*a+n]=e[0+n]*t[4*a+0]+e[4+n]*t[4*a+1]+e[8+n]*t[4*a+2]+e[12+n]*t[4*a+3];return r}((a=Math.PI/3,n=h/b,s=1/Math.tan(a/2),(f=new Float32Array(16))[0]=s/n,f[5]=s,f[10]=V/(O-V),f[11]=-1,f[14]=O*V/(O-V),f),function(e,t,r){let[a,n,o]=e,[i,l,u]=t,s=i-a,f=l-n,c=u-o,d=Math.hypot(s,f,c);s/=d,f/=d;let p=f*r[2]-(c/=d)*r[1],h=c*r[0]-s*r[2],m=s*r[1]-f*r[0],v=Math.hypot(p,h,m);p/=v;let g=(h/=v)*c-(m/=v)*f,y=m*s-p*c,b=p*f-h*s,w=new Float32Array(16);return w[0]=p,w[1]=g,w[2]=-s,w[3]=0,w[4]=h,w[5]=y,w[6]=-f,w[7]=0,w[8]=m,w[9]=b,w[10]=-c,w[11]=0,w[12]=-(p*a+h*n+m*o),w[13]=-(g*a+y*n+b*o),w[14]=s*a+f*n+c*o,w[15]=1,w}([Math.cos(S.pitch)*Math.sin(S.yaw)*S.distance,Math.sin(S.pitch)*S.distance,Math.cos(S.pitch)*Math.cos(S.yaw)*S.distance],[0,0,0],[0,1,0])),U=new Float32Array(20);U.set(T,0);let A=Math.hypot(.4,.8,.45);U[16]=.4/A,U[17]=.8/A,U[18]=.45/A,o.queue.writeBuffer(y,0,U);let G=o.createCommandEncoder(),F=u.getCurrentTexture().createView(),q=G.beginRenderPass({colorAttachments:[{view:F,clearValue:{r:.03,g:.05,b:.12,a:1},loadOp:"clear",storeOp:"store"}],depthStencilAttachment:{view:r.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"store"}});q.setPipeline(R),q.setBindGroup(0,w),q.setVertexBuffer(0,_),q.draw(L);let Y=d.current.wireframe?E:C;q.setPipeline(Y),q.setBindGroup(0,w),q.setVertexBuffer(0,v),q.setIndexBuffer(g,"uint32"),q.drawIndexed(m),q.end(),o.queue.submit([G.finish()]),I++;let z=performance.now();if(z-D>=500){let e=Math.round(1e3*I/(z-D)),t=N/Math.max(I,1);p.current?.({fps:e,stepMs:t}),I=0,N=0,D=z}t=requestAnimationFrame(W)};return t=requestAnimationFrame(W),()=>{l=!0,void 0!==t&&cancelAnimationFrame(t),i.removeEventListener("pointerdown",A),i.removeEventListener("pointermove",G),i.removeEventListener("pointerup",F),i.removeEventListener("wheel",q),r?.destroy()}},[e,o]),(0,t.jsx)("canvas",{ref:c,style:{width:"100%",height:"100%",display:"block",background:"#000",cursor:"grab"}})}])},35020,e=>{e.n(e.i(39534))}]);