/** @type {import('next').NextConfig} */
// Backend URL for the server-side rewrite. NEXT_PUBLIC_ vars are NOT used
// here on purpose — this rewrite runs on the Next.js server, so it should
// hit the backend's internal address (e.g. http://api:5000 in docker-compose)
// not the public domain.
const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL || 'http://localhost:5000';

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_INTERNAL_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
