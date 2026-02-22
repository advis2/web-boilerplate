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
  
  // **Next.js 13 이상에서 `output: export`를 설정**
  output: 'export',  // 정적 사이트 빌드 설정

  // GitHub Pages에 배포 시 basePath 설정
  basePath: process.env.GITHUB_ACTIONS ? '/web-boilerplate' : '',  // `<repo-name>`을 실제 GitHub 레포지토리 이름으로 교체
  assetPrefix: process.env.GITHUB_ACTIONS ? '/web-boilerplate' : '', // GitHub Pages에서 자산의 경로 설정
  distDir: 'out',  // Next.js에서 정적 파일을 `out` 디렉토리로 내보내기 위해 설정  

  // **동적 API 라우트를 정적 내보내기에서 제외 (리디렉션 처리)**
  async redirects() {
    return [
      {
        source: '/api/:path*',  // API 경로를
        destination: '/404',    // 404로 리디렉션
        permanent: true,        // 리디렉션을 영구적으로 처리
      },
    ]
  },

  // 서버 사이드 렌더링 또는 동적 페이지 처리가 필요하다면
  // `next export`와 호환되지 않으므로 다른 서버에서 처리할 필요가 있음  
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
