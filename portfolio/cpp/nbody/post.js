// post.js — emcc IIFE closure 안쪽에 추가됨.
// emscripten WebGPU runtime의 WebGPU 객체 (mgrBuffer 등)를 Module에 노출해
// JS 측에서 C++가 만든 WGPUBuffer handle을 GPUBuffer로 변환 가능하게 함.
Module["WebGPU"] = WebGPU;
