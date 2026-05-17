// nbody.cpp
// Step 1: 최소 hello WASM
// Step 2: emscripten_webgpu_get_device() 로 JS WebGPU device 공유
// Step 3: webgpu.h로 buffer/pipeline + N-body compute kernel dispatch (현재)
// Step 4+ 예정: GPU buffer를 JS render pipeline과 share, UI polish
#include <emscripten/emscripten.h>
#include <emscripten/html5_webgpu.h>
#include <webgpu/webgpu.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static WGPUDevice           g_device       = nullptr;
static WGPUQueue            g_queue        = nullptr;
static WGPUBuffer           g_particleBuf  = nullptr;
static WGPUBuffer           g_paramsBuf    = nullptr;
static WGPUBuffer           g_readbackBuf  = nullptr;
static WGPUComputePipeline  g_pipeline     = nullptr;
static WGPUBindGroup        g_bindGroup    = nullptr;
static int                  g_count        = 0;

// N-body all-pairs gravity kernel.
// Particle struct: position (vec3 + pad), velocity (vec3 + pad) = 32 bytes.
static const char* WGSL_KERNEL = R"WGSL(
struct Particle {
  pos : vec3<f32>,
  _p0 : f32,
  vel : vec3<f32>,
  _p1 : f32,
};

struct Params {
  count     : u32,
  dt        : f32,
  G         : f32,
  softening : f32,
};

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform>              params    : Params;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let i = gid.x;
  if (i >= params.count) { return; }

  let p_i = particles[i].pos;
  var force = vec3<f32>(0.0);
  let soft2 = params.softening * params.softening;

  for (var j : u32 = 0u; j < params.count; j = j + 1u) {
    if (j == i) { continue; }
    let dp = particles[j].pos - p_i;
    let r2 = dot(dp, dp) + soft2;
    let inv_r3 = pow(r2, -1.5);
    force = force + dp * inv_r3;
  }

  force = force * params.G;

  var v = particles[i].vel + force * params.dt;
  var p = p_i + v * params.dt;

  particles[i].pos = p;
  particles[i].vel = v;
}
)WGSL";

extern "C" {

EMSCRIPTEN_KEEPALIVE
int nbody_hello() {
  return 42;
}

EMSCRIPTEN_KEEPALIVE
int nbody_init_webgpu() {
  g_device = emscripten_webgpu_get_device();
  if (!g_device) {
    printf("[C++] emscripten_webgpu_get_device() returned null\n");
    return -1;
  }
  g_queue = wgpuDeviceGetQueue(g_device);
  if (!g_queue) {
    printf("[C++] wgpuDeviceGetQueue returned null\n");
    return -2;
  }
  printf("[C++] WebGPU device acquired (handle=%p, queue=%p)\n",
         (void*)g_device, (void*)g_queue);
  return 0;
}

EMSCRIPTEN_KEEPALIVE
unsigned int nbody_get_device_handle() {
  return (unsigned int)(uintptr_t)g_device;
}

// Setup: particle/params/readback buffers + shader module + pipeline + bind group.
// initialPtr는 WASM heap 안의 Particle 배열 (32B * count) 시작 주소.
// Returns 0 on success, negative on failure.
EMSCRIPTEN_KEEPALIVE
int nbody_setup(int count, uintptr_t initialPtr) {
  if (!g_device || !g_queue) {
    printf("[C++] nbody_setup: device not ready (call nbody_init_webgpu first)\n");
    return -1;
  }
  g_count = count;
  size_t particleBytes = (size_t)count * 32;

  // 1. Particle storage buffer (storage + copy_src for readback, copy_dst for upload)
  {
    WGPUBufferDescriptor desc = {};
    desc.size  = particleBytes;
    desc.usage = WGPUBufferUsage_Storage
               | WGPUBufferUsage_CopyDst
               | WGPUBufferUsage_CopySrc;
    g_particleBuf = wgpuDeviceCreateBuffer(g_device, &desc);
  }
  if (!g_particleBuf) { printf("[C++] particleBuf create failed\n"); return -2; }

  // Upload initial particles from WASM heap.
  wgpuQueueWriteBuffer(g_queue, g_particleBuf, 0,
                       (const void*)initialPtr, particleBytes);

  // 2. Params uniform buffer
  {
    WGPUBufferDescriptor desc = {};
    desc.size  = 16; // count(u32) + dt(f32) + G(f32) + softening(f32) = 16B
    desc.usage = WGPUBufferUsage_Uniform | WGPUBufferUsage_CopyDst;
    g_paramsBuf = wgpuDeviceCreateBuffer(g_device, &desc);
  }
  if (!g_paramsBuf) { printf("[C++] paramsBuf create failed\n"); return -3; }

  // 3. Readback buffer (디버깅용; Step 4에서 render에 사용)
  {
    WGPUBufferDescriptor desc = {};
    desc.size  = particleBytes;
    desc.usage = WGPUBufferUsage_MapRead | WGPUBufferUsage_CopyDst;
    g_readbackBuf = wgpuDeviceCreateBuffer(g_device, &desc);
  }
  if (!g_readbackBuf) { printf("[C++] readbackBuf create failed\n"); return -4; }

  // 4. Shader module (WGSL)
  WGPUShaderModuleWGSLDescriptor wgslDesc = {};
  wgslDesc.chain.sType = WGPUSType_ShaderModuleWGSLDescriptor;
  wgslDesc.code = WGSL_KERNEL;
  WGPUShaderModuleDescriptor smDesc = {};
  smDesc.nextInChain = (const WGPUChainedStruct*)&wgslDesc;
  WGPUShaderModule shaderModule = wgpuDeviceCreateShaderModule(g_device, &smDesc);
  if (!shaderModule) { printf("[C++] shaderModule create failed\n"); return -5; }

  // 5. Bind group layout
  WGPUBindGroupLayoutEntry bglEntries[2] = {};
  bglEntries[0].binding     = 0;
  bglEntries[0].visibility  = WGPUShaderStage_Compute;
  bglEntries[0].buffer.type = WGPUBufferBindingType_Storage;
  bglEntries[1].binding     = 1;
  bglEntries[1].visibility  = WGPUShaderStage_Compute;
  bglEntries[1].buffer.type = WGPUBufferBindingType_Uniform;

  WGPUBindGroupLayoutDescriptor bglDesc = {};
  bglDesc.entryCount = 2;
  bglDesc.entries    = bglEntries;
  WGPUBindGroupLayout bgl = wgpuDeviceCreateBindGroupLayout(g_device, &bglDesc);
  if (!bgl) { printf("[C++] bindGroupLayout create failed\n"); return -6; }

  // 6. Pipeline layout
  WGPUPipelineLayoutDescriptor plDesc = {};
  plDesc.bindGroupLayoutCount = 1;
  plDesc.bindGroupLayouts     = &bgl;
  WGPUPipelineLayout pipelineLayout = wgpuDeviceCreatePipelineLayout(g_device, &plDesc);

  // 7. Compute pipeline
  WGPUComputePipelineDescriptor cpDesc = {};
  cpDesc.layout              = pipelineLayout;
  cpDesc.compute.module      = shaderModule;
  cpDesc.compute.entryPoint  = "main";
  g_pipeline = wgpuDeviceCreateComputePipeline(g_device, &cpDesc);
  if (!g_pipeline) { printf("[C++] computePipeline create failed\n"); return -7; }

  // 8. Bind group
  WGPUBindGroupEntry bgEntries[2] = {};
  bgEntries[0].binding = 0;
  bgEntries[0].buffer  = g_particleBuf;
  bgEntries[0].size    = particleBytes;
  bgEntries[1].binding = 1;
  bgEntries[1].buffer  = g_paramsBuf;
  bgEntries[1].size    = 16;

  WGPUBindGroupDescriptor bgDesc = {};
  bgDesc.layout     = bgl;
  bgDesc.entryCount = 2;
  bgDesc.entries    = bgEntries;
  g_bindGroup = wgpuDeviceCreateBindGroup(g_device, &bgDesc);
  if (!g_bindGroup) { printf("[C++] bindGroup create failed\n"); return -8; }

  printf("[C++] nbody_setup OK: count=%d, particleBytes=%zu\n", count, particleBytes);
  return 0;
}

// One simulation step: update params + dispatch compute.
EMSCRIPTEN_KEEPALIVE
void nbody_step(float dt, float G, float softening) {
  if (!g_pipeline) return;

  struct Params {
    uint32_t count;
    float    dt;
    float    G;
    float    softening;
  };
  Params p = { (uint32_t)g_count, dt, G, softening };
  wgpuQueueWriteBuffer(g_queue, g_paramsBuf, 0, &p, sizeof(p));

  WGPUCommandEncoder enc = wgpuDeviceCreateCommandEncoder(g_device, nullptr);
  WGPUComputePassEncoder pass = wgpuCommandEncoderBeginComputePass(enc, nullptr);
  wgpuComputePassEncoderSetPipeline(pass, g_pipeline);
  wgpuComputePassEncoderSetBindGroup(pass, 0, g_bindGroup, 0, nullptr);
  uint32_t workgroups = (uint32_t)((g_count + 63) / 64);
  wgpuComputePassEncoderDispatchWorkgroups(pass, workgroups, 1, 1);
  wgpuComputePassEncoderEnd(pass);

  WGPUCommandBuffer cb = wgpuCommandEncoderFinish(enc, nullptr);
  wgpuQueueSubmit(g_queue, 1, &cb);
}

// Copy particle buffer → readback buffer. Actual mapAsync happens on JS side
// (handle 노출은 Step 4에서 추가; 이번 step에서는 dispatch 검증용).
EMSCRIPTEN_KEEPALIVE
void nbody_copy_to_readback() {
  if (!g_particleBuf || !g_readbackBuf) return;
  WGPUCommandEncoder enc = wgpuDeviceCreateCommandEncoder(g_device, nullptr);
  wgpuCommandEncoderCopyBufferToBuffer(enc, g_particleBuf, 0,
                                       g_readbackBuf, 0,
                                       (uint64_t)g_count * 32);
  WGPUCommandBuffer cb = wgpuCommandEncoderFinish(enc, nullptr);
  wgpuQueueSubmit(g_queue, 1, &cb);
}

EMSCRIPTEN_KEEPALIVE
unsigned int nbody_get_particle_buffer() {
  return (unsigned int)(uintptr_t)g_particleBuf;
}

EMSCRIPTEN_KEEPALIVE
unsigned int nbody_get_readback_buffer() {
  return (unsigned int)(uintptr_t)g_readbackBuf;
}

EMSCRIPTEN_KEEPALIVE
int nbody_get_count() {
  return g_count;
}

EMSCRIPTEN_KEEPALIVE
void* nbody_malloc(size_t n) { return malloc(n); }

EMSCRIPTEN_KEEPALIVE
void nbody_free(void* p) { free(p); }

}  // extern "C"
