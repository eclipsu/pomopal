/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: ["cdn.discordapp.com", "lh3.googleusercontent.com"],
  },
  async rewrites() {
    const backend = process.env.API_PROXY_TARGET || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/:path*`,
      },
    ];
  },
};
