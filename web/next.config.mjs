/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@stripesync/shared'],
  async rewrites() {
    return [
      { source: '/auth/stripe/:path*', destination: '/api/stripe/:path*' },
      { source: '/auth/xero/:path*', destination: '/api/xero/:path*' },
    ];
  },
};

export default nextConfig;
