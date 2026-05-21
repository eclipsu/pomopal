/**
 * API base URL for axios / socket.io.
 * Production: same-origin /api (Vercel rewrite).
 * Local dev: same-origin /api (Next rewrite → backend) so auth cookies work on one host:port.
 */
export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (
      hostname === "pomopal.lol" ||
      hostname === "www.pomopal.lol" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      return `${origin}/api`;
    }
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  return "http://localhost:8000";
}

/**
 * Socket.IO must hit the Nest server directly (not the Next /api rewrite).
 * Vercel rewrites do not proxy WebSockets; set NEXT_PUBLIC_SOCKET_URL in production
 * to your backend origin (must be wss:// when the app is served over HTTPS).
 */
export function getSocketBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }

  return getApiBaseUrl();
}
