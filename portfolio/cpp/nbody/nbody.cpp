// nbody.cpp — Step 1: 최소 hello WASM
// Step 2부터 webgpu.h 통합 + N-body 알고리즘 추가 예정.
#include <emscripten/emscripten.h>
#include <stdint.h>

extern "C" {

EMSCRIPTEN_KEEPALIVE
int nbody_hello() {
  return 42;
}

// 메모리 할당 도우미 (JS에서 호출)
EMSCRIPTEN_KEEPALIVE
void* nbody_malloc(size_t n) {
  return malloc(n);
}

EMSCRIPTEN_KEEPALIVE
void nbody_free(void* p) {
  free(p);
}

}  // extern "C"
