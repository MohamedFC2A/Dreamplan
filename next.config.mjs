/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['https://*.replit.dev', 'https://*.replit.app', 'https://*.worf.replit.dev'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
