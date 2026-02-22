//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},

  // GitHub Pages에 배포 시 basePath 설정
  basePath: process.env.GITHUB_ACTIONS ? '/web-boilerplate' : '',  // `<repo-name>`을 실제 GitHub 레포지토리 이름으로 교체
  assetPrefix: process.env.GITHUB_ACTIONS ? '/web-boilerplate' : '', // GitHub Pages에서 자산의 경로 설정
  distDir: 'out',  // Next.js에서 정적 파일을 `out` 디렉토리로 내보내기 위해 설정  
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
