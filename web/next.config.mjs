/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@stripesync/shared'],
  async rewrites() {
    return [
      { source: '/auth/stripe/:path*', destination: '/api/stripe/:path*' },
      { source: '/auth/xero/:path*', destination: '/api/xero/:path*' },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'silkview.org' }],
        destination: 'https://www.silkview.org/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
