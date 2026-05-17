// mesh.cpp
// 절차적 mesh (sphere / torus) 생성 + WebGPU compute kernel로 vertex 변형.
// 데이터 흐름:
//   C++가 vertex/index/rest 버퍼 생성 + GPU에 upload
//   매 프레임 compute kernel이 rest position + normal 기반으로 vertex 변형
//   JS render pipeline이 같은 vertex buffer를 vertex attribute로 사용 (zero-copy)
#include <emscripten/emscripten.h>
#include <emscripten/html5_webgpu.h>
#include <webgpu/webgpu.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <vector>

#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif

// 32B vertex (pos vec3 + pad + normal vec3 + pad) — WGSL alignment
struct Vertex {
  float pos[3];    float _p0;
  float normal[3]; float _p1;
};

// 16B rest position (vec3 + pad)
struct RestPos {
  float pos[3]; float _p0;
};

static WGPUDevice          g_device      = nullptr;
static WGPUQueue           g_queue       = nullptr;
static WGPUBuffer          g_vertexBuf   = nullptr;
static WGPUBuffer          g_restBuf     = nullptr;
static WGPUBuffer          g_indexBuf    = nullptr;
static WGPUBuffer          g_paramsBuf   = nullptr;
static WGPUComputePipeline g_pipeline    = nullptr;
static WGPUBindGroup       g_bindGroup   = nullptr;
static int                 g_vertexCount = 0;
static int                 g_indexCount  = 0;

static const char* COMPUTE_WGSL = R"WGSL(
struct Vertex {
  pos : vec3<f32>,
  _p0 : f32,
  normal : vec3<f32>,
  _p1 : f32,
};

struct RestPos {
  pos : vec3<f32>,
  _p0 : f32,
};

struct Params {
  vertexCount : u32,
  time        : f32,
  amplitude   : f32,
  frequency   : f32,
};

@group(0) @binding(0) var<storage, read_write> vertices : array<Vertex>;
@group(0) @binding(1) var<storage, read>       rest     : array<RestPos>;
@group(0) @binding(2) var<uniform>              params   : Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let i = gid.x;
  if (i >= params.vertexCount) { return; }

  let r = rest[i].pos;
  let n = vertices[i].normal;

  // 3D wave on rest position
  let wave = sin(params.time * 2.0 + r.x * params.frequency)
           * cos(params.time * 1.3 + r.y * params.frequency)
           * sin(params.time * 0.7 + r.z * params.frequency);

  vertices[i].pos = r + n * wave * params.amplitude;
}
)WGSL";

// 절차적 UV sphere — radius = 1
static void generateSphere(int latSeg, int lonSeg,
                           std::vector<Vertex>& verts,
                           std::vector<RestPos>& rests,
                           std::vector<uint32_t>& indices) {
  for (int i = 0; i <= latSeg; i++) {
    float phi = M_PI * (float)i / (float)latSeg;
    float y = cosf(phi);
    float r = sinf(phi);
    for (int j = 0; j <= lonSeg; j++) {
      float theta = 2.0f * M_PI * (float)j / (float)lonSeg;
      float x = r * cosf(theta);
      float z = r * sinf(theta);

      Vertex v;
      v.pos[0] = x; v.pos[1] = y; v.pos[2] = z; v._p0 = 0;
      v.normal[0] = x; v.normal[1] = y; v.normal[2] = z; v._p1 = 0;
      verts.push_back(v);

      RestPos rp;
      rp.pos[0] = x; rp.pos[1] = y; rp.pos[2] = z; rp._p0 = 0;
      rests.push_back(rp);
    }
  }

  for (int i = 0; i < latSeg; i++) {
    for (int j = 0; j < lonSeg; j++) {
      uint32_t a = (uint32_t)(i * (lonSeg + 1) + j);
      uint32_t b = a + 1;
      uint32_t c = a + (uint32_t)(lonSeg + 1);
      uint32_t d = c + 1;
      indices.push_back(a); indices.push_back(b); indices.push_back(c);
      indices.push_back(b); indices.push_back(d); indices.push_back(c);
    }
  }
}

// 절차적 torus — R = major radius, r = minor radius
static void generateTorus(int majorSeg, int minorSeg, float R, float minorR,
                          std::vector<Vertex>& verts,
                          std::vector<RestPos>& rests,
                          std::vector<uint32_t>& indices) {
  for (int i = 0; i <= majorSeg; i++) {
    float u = 2.0f * M_PI * (float)i / (float)majorSeg;
    float cu = cosf(u), su = sinf(u);
    for (int j = 0; j <= minorSeg; j++) {
      float v = 2.0f * M_PI * (float)j / (float)minorSeg;
      float cv = cosf(v), sv = sinf(v);

      float x = (R + minorR * cv) * cu;
      float y = minorR * sv;
      float z = (R + minorR * cv) * su;
      float nx = cv * cu;
      float ny = sv;
      float nz = cv * su;

      Vertex vert;
      vert.pos[0] = x; vert.pos[1] = y; vert.pos[2] = z; vert._p0 = 0;
      vert.normal[0] = nx; vert.normal[1] = ny; vert.normal[2] = nz; vert._p1 = 0;
      verts.push_back(vert);

      RestPos rp;
      rp.pos[0] = x; rp.pos[1] = y; rp.pos[2] = z; rp._p0 = 0;
      rests.push_back(rp);
    }
  }

  for (int i = 0; i < majorSeg; i++) {
    for (int j = 0; j < minorSeg; j++) {
      uint32_t a = (uint32_t)(i * (minorSeg + 1) + j);
      uint32_t b = a + 1;
      uint32_t c = a + (uint32_t)(minorSeg + 1);
      uint32_t d = c + 1;
      indices.push_back(a); indices.push_back(c); indices.push_back(b);
      indices.push_back(b); indices.push_back(c); indices.push_back(d);
    }
  }
}

extern "C" {

EMSCRIPTEN_KEEPALIVE
int mesh_init_webgpu() {
  g_device = emscripten_webgpu_get_device();
  if (!g_device) return -1;
  g_queue = wgpuDeviceGetQueue(g_device);
  if (!g_queue) return -2;
  printf("[C++] mesh: webgpu device acquired\n");
  return 0;
}

// kind: 0 = sphere, 1 = torus
EMSCRIPTEN_KEEPALIVE
int mesh_setup(int kind, int seg1, int seg2) {
  if (!g_device || !g_queue) return -1;

  // 이전 리소스 해제
  if (g_bindGroup) { wgpuBindGroupRelease(g_bindGroup); g_bindGroup = nullptr; }
  if (g_pipeline)  { wgpuComputePipelineRelease(g_pipeline); g_pipeline = nullptr; }
  if (g_vertexBuf) { wgpuBufferRelease(g_vertexBuf); g_vertexBuf = nullptr; }
  if (g_restBuf)   { wgpuBufferRelease(g_restBuf); g_restBuf = nullptr; }
  if (g_indexBuf)  { wgpuBufferRelease(g_indexBuf); g_indexBuf = nullptr; }
  if (g_paramsBuf) { wgpuBufferRelease(g_paramsBuf); g_paramsBuf = nullptr; }

  std::vector<Vertex>   verts;
  std::vector<RestPos>  rests;
  std::vector<uint32_t> indices;

  if (kind == 0) {
    generateSphere(seg1, seg2, verts, rests, indices);
  } else {
    generateTorus(seg1, seg2, 1.0f, 0.4f, verts, rests, indices);
  }

  g_vertexCount = (int)verts.size();
  g_indexCount  = (int)indices.size();

  // Vertex buffer (storage + vertex usage for direct render attribute access)
  {
    WGPUBufferDescriptor desc = {};
    desc.size  = verts.size() * sizeof(Vertex);
    desc.usage = WGPUBufferUsage_Storage | WGPUBufferUsage_Vertex | WGPUBufferUsage_CopyDst;
    g_vertexBuf = wgpuDeviceCreateBuffer(g_device, &desc);
  }
  wgpuQueueWriteBuffer(g_queue, g_vertexBuf, 0,
                       verts.data(), verts.size() * sizeof(Vertex));

  // Rest position buffer (read-only storage, kernel input)
  {
    WGPUBufferDescriptor desc = {};
    desc.size  = rests.size() * sizeof(RestPos);
    desc.usage = WGPUBufferUsage_Storage | WGPUBufferUsage_CopyDst;
    g_restBuf = wgpuDeviceCreateBuffer(g_device, &desc);
  }
  wgpuQueueWriteBuffer(g_queue, g_restBuf, 0,
                       rests.data(), rests.size() * sizeof(RestPos));

  // Index buffer
  {
    WGPUBufferDescriptor desc = {};
    desc.size  = indices.size() * sizeof(uint32_t);
    desc.usage = WGPUBufferUsage_Index | WGPUBufferUsage_CopyDst;
    g_indexBuf = wgpuDeviceCreateBuffer(g_device, &desc);
  }
  wgpuQueueWriteBuffer(g_queue, g_indexBuf, 0,
                       indices.data(), indices.size() * sizeof(uint32_t));

  // Params uniform (16B)
  {
    WGPUBufferDescriptor desc = {};
    desc.size  = 16;
    desc.usage = WGPUBufferUsage_Uniform | WGPUBufferUsage_CopyDst;
    g_paramsBuf = wgpuDeviceCreateBuffer(g_device, &desc);
  }

  // Compute shader + pipeline
  WGPUShaderModuleWGSLDescriptor wgsl = {};
  wgsl.chain.sType = WGPUSType_ShaderModuleWGSLDescriptor;
  wgsl.code = COMPUTE_WGSL;
  WGPUShaderModuleDescriptor sm = {};
  sm.nextInChain = (const WGPUChainedStruct*)&wgsl;
  WGPUShaderModule shaderModule = wgpuDeviceCreateShaderModule(g_device, &sm);

  // BGL: 0 = vertices RW, 1 = rest RO, 2 = params uniform
  WGPUBindGroupLayoutEntry bglE[3] = {};
  bglE[0].binding     = 0;
  bglE[0].visibility  = WGPUShaderStage_Compute;
  bglE[0].buffer.type = WGPUBufferBindingType_Storage;
  bglE[1].binding     = 1;
  bglE[1].visibility  = WGPUShaderStage_Compute;
  bglE[1].buffer.type = WGPUBufferBindingType_ReadOnlyStorage;
  bglE[2].binding     = 2;
  bglE[2].visibility  = WGPUShaderStage_Compute;
  bglE[2].buffer.type = WGPUBufferBindingType_Uniform;

  WGPUBindGroupLayoutDescriptor bglD = {};
  bglD.entryCount = 3;
  bglD.entries    = bglE;
  WGPUBindGroupLayout bgl = wgpuDeviceCreateBindGroupLayout(g_device, &bglD);

  WGPUPipelineLayoutDescriptor plD = {};
  plD.bindGroupLayoutCount = 1;
  plD.bindGroupLayouts     = &bgl;
  WGPUPipelineLayout pl = wgpuDeviceCreatePipelineLayout(g_device, &plD);

  WGPUComputePipelineDescriptor cpD = {};
  cpD.layout              = pl;
  cpD.compute.module      = shaderModule;
  cpD.compute.entryPoint  = "main";
  g_pipeline = wgpuDeviceCreateComputePipeline(g_device, &cpD);

  WGPUBindGroupEntry bgE[3] = {};
  bgE[0].binding = 0; bgE[0].buffer = g_vertexBuf; bgE[0].size = verts.size() * sizeof(Vertex);
  bgE[1].binding = 1; bgE[1].buffer = g_restBuf;   bgE[1].size = rests.size() * sizeof(RestPos);
  bgE[2].binding = 2; bgE[2].buffer = g_paramsBuf; bgE[2].size = 16;

  WGPUBindGroupDescriptor bgD = {};
  bgD.layout     = bgl;
  bgD.entryCount = 3;
  bgD.entries    = bgE;
  g_bindGroup = wgpuDeviceCreateBindGroup(g_device, &bgD);

  printf("[C++] mesh_setup OK: kind=%d, vertices=%d, indices=%d, triangles=%d\n",
         kind, g_vertexCount, g_indexCount, g_indexCount / 3);
  return 0;
}

EMSCRIPTEN_KEEPALIVE
void mesh_step(float time, float amplitude, float frequency) {
  if (!g_pipeline) return;

  struct Params {
    uint32_t vertexCount;
    float    time;
    float    amplitude;
    float    frequency;
  };
  Params p = { (uint32_t)g_vertexCount, time, amplitude, frequency };
  wgpuQueueWriteBuffer(g_queue, g_paramsBuf, 0, &p, sizeof(p));

  WGPUCommandEncoder enc = wgpuDeviceCreateCommandEncoder(g_device, nullptr);
  WGPUComputePassEncoder pass = wgpuCommandEncoderBeginComputePass(enc, nullptr);
  wgpuComputePassEncoderSetPipeline(pass, g_pipeline);
  wgpuComputePassEncoderSetBindGroup(pass, 0, g_bindGroup, 0, nullptr);
  uint32_t wg = (uint32_t)((g_vertexCount + 63) / 64);
  wgpuComputePassEncoderDispatchWorkgroups(pass, wg, 1, 1);
  wgpuComputePassEncoderEnd(pass);

  WGPUCommandBuffer cb = wgpuCommandEncoderFinish(enc, nullptr);
  wgpuQueueSubmit(g_queue, 1, &cb);
}

EMSCRIPTEN_KEEPALIVE
unsigned int mesh_get_vertex_buffer() {
  return (unsigned int)(uintptr_t)g_vertexBuf;
}

EMSCRIPTEN_KEEPALIVE
unsigned int mesh_get_index_buffer() {
  return (unsigned int)(uintptr_t)g_indexBuf;
}

EMSCRIPTEN_KEEPALIVE
int mesh_get_vertex_count() { return g_vertexCount; }

EMSCRIPTEN_KEEPALIVE
int mesh_get_index_count() { return g_indexCount; }

}  // extern "C"
