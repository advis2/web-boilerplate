# build.ps1 — nbody.cpp → wasm + js glue
# 산출물: portfolio/public/wasm/nbody.{js,wasm}
#
# 사용: pwsh portfolio/cpp/nbody/build.ps1

# emcc는 progress info를 stderr로 출력 — PowerShell이 그걸 error로 오해하지 않도록
$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..\..")
$outDir = Join-Path $projectRoot "portfolio\public\wasm"

if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$srcFile = Join-Path $scriptDir "nbody.cpp"
$outFile = Join-Path $outDir "nbody.js"

$emccArgs = @(
  $srcFile,
  "-O3",
  "-sMODULARIZE=1",
  "-sEXPORT_NAME=createNBodyModule",
  "-sENVIRONMENT=web",
  "-sALLOW_MEMORY_GROWTH=1",
  "-sUSE_WEBGPU=1",
  "--post-js", (Join-Path $scriptDir "post.js"),
  "-sEXPORTED_FUNCTIONS=_nbody_hello,_nbody_init_webgpu,_nbody_get_device_handle,_nbody_setup,_nbody_step,_nbody_copy_to_readback,_nbody_get_particle_buffer,_nbody_get_readback_buffer,_nbody_get_count,_nbody_malloc,_nbody_free,_malloc,_free",
  "-o", $outFile
)

Write-Output "Running: emcc $($emccArgs -join ' ')"
& emcc @emccArgs

if ($LASTEXITCODE -ne 0) {
  Write-Error "emcc failed with exit $LASTEXITCODE"
  exit $LASTEXITCODE
}

Write-Output "Built: $outFile (+ .wasm)"
