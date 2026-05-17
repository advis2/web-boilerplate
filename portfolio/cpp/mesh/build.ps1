# build.ps1 — mesh.cpp → wasm + js glue
# 산출물: portfolio/public/wasm/mesh.{js,wasm}

$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..\..")
$outDir = Join-Path $projectRoot "portfolio\public\wasm"

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$srcFile = Join-Path $scriptDir "mesh.cpp"
$postJs  = Join-Path $scriptDir "post.js"
$outFile = Join-Path $outDir "mesh.js"

$emccArgs = @(
  $srcFile,
  "-O3",
  "-std=c++17",
  "-sMODULARIZE=1",
  "-sEXPORT_NAME=createMeshModule",
  "-sENVIRONMENT=web",
  "-sALLOW_MEMORY_GROWTH=1",
  "-sUSE_WEBGPU=1",
  "--post-js", $postJs,
  "-sEXPORTED_FUNCTIONS=_mesh_init_webgpu,_mesh_setup,_mesh_step,_mesh_get_vertex_buffer,_mesh_get_index_buffer,_mesh_get_vertex_count,_mesh_get_index_count,_malloc,_free",
  "-o", $outFile
)

Write-Output "Running: emcc $($emccArgs -join ' ')"
& emcc @emccArgs

if ($LASTEXITCODE -ne 0) {
  Write-Error "emcc failed with exit $LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Output "Built: $outFile (+ .wasm)"
