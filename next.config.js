/** @type {import('next').NextConfig} */

function s3Hostname() {
  const base =
    process.env.NEXT_PUBLIC_S3_BASE_URL ||
    "https://pomopal.s3.us-east-2.amazonaws.com";
  try {
    return new URL(base).hostname;
  } catch {
    return "pomopal.s3.us-east-2.amazonaws.com";
  }
}

module.exports = {
  // next-mdx-remote must share the app's React runtime (avoids
  // "React Element from an older version of React" with Next 15/16).
  transpilePackages: ["next-mdx-remote"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: s3Hostname(), pathname: "/**" },
      { protocol: "https", hostname: "cdn.discordapp.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
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
