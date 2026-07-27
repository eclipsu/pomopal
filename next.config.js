/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: [
      "cdn.discordapp.com",
      "lh3.googleusercontent.com",
      "pomopal.s3.us-east-2.amazonaws.com",
    ],
  },
  // Allow long YouTube audio downloads through the local /api proxy (default is ~30s).
  experimental: {
    proxyTimeout: 90 * 60 * 1000,
  },
  async rewrites() {
    const backend = process.env.API_PROXY_TARGET || "http://localhost:8000";
    return [
      {
        // Fonts are served from the frontend origin (`/fonts/...`) so @font-face
        // never hits S3 cross-origin — Next proxies to Nest.
        source: "/fonts/:path*",
        destination: `${backend}/fonts/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backend}/:path*`,
      },
    ];
  },
};
