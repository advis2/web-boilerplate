// nbody.cpp
// Step 1: 최소 hello WASM
// Step 2: emscripten_webgpu_get_device() 로 JS WebGPU device 공유 (현재)
// Step 3+ 예정: webgpu.h로 buffer/pipeline + N-body kernel
#include <emscripten/emscripten.h>
#include <emscripten/html5_webgpu.h>
#include <webgpu/webgpu.h>
#include <stdint.h>
#include <stdio.h>

static WGPUDevice g_device = nullptr;
static WGPUQueue  g_queue  = nullptr;

extern "C" {

EMSCRIPTEN_KEEPALIVE
int nbody_hello() {
  return 42;
}

// JS 측이 Module.preinitializedWebGPUDevice = device 로 미리 셋업해두면
// emscripten 런타임이 같은 device handle을 C++로 노출.
// 반환값: 0 = OK, -1 = device 없음, -2 = queue 없음.
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

// device handle (raw pointer) — JS와 같은 객체를 가리키는지 디버깅용
EMSCRIPTEN_KEEPALIVE
unsigned int nbody_get_device_handle() {
  return (unsigned int)(uintptr_t)g_device;
}

EMSCRIPTEN_KEEPALIVE
void* nbody_malloc(size_t n) {
  return malloc(n);
}

EMSCRIPTEN_KEEPALIVE
void nbody_free(void* p) {
  free(p);
}

}  // extern "C"
