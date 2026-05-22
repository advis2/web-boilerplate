# deploy.ps1 — portfolio를 GitHub Pages (gh-pages 브랜치) 수동 배포
#
# CI 실패 시 또는 즉시 배포가 필요할 때 사용.
# 흐름: GITHUB_ACTIONS=true 환경에서 빌드 → .nojekyll 추가 → gh-pages publish
#
# 사용: pwsh portfolio/scripts/deploy.ps1
#
# 사전 조건:
#   - emscripten / pnpm install 완료
#   - git origin 에 push 권한
#   - npx 사용 가능

$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptDir "..\..")
Set-Location $projectRoot

# next.config.js의 basePath: process.env.GITHUB_ACTIONS ? '/web-boilerplate' : ''
# CI가 아닌 환경에서 빌드한 산출물은 asset path가 잘못돼 GH Pages에서 404 됨.
$env:GITHUB_ACTIONS = "true"

Write-Output "[deploy] build portfolio with GITHUB_ACTIONS=true"
pnpm nx build portfolio
if ($LASTEXITCODE -ne 0) {
  Write-Error "build failed (exit $LASTEXITCODE)"
  exit $LASTEXITCODE
}

$outDir = "dist\apps\portfolio\out"
if (-not (Test-Path $outDir)) {
  Write-Error "$outDir not found after build"
  exit 1
}

# Jekyll 처리 비활성화 (Next.js _next 폴더가 무시되지 않도록)
New-Item -ItemType File -Force -Path "$outDir\.nojekyll" | Out-Null

$sha = (git rev-parse --short HEAD).Trim()
Write-Output "[deploy] publishing $outDir → gh-pages (manual deploy: $sha)"

npx --yes gh-pages -d $outDir --dotfiles -m "manual deploy: $sha"
if ($LASTEXITCODE -ne 0) {
  Write-Error "gh-pages publish failed (exit $LASTEXITCODE)"
  exit $LASTEXITCODE
}

Write-Output "[deploy] done. URL: https://advis2.github.io/web-boilerplate/"
