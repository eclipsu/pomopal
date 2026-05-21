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

const PRODUCTION_HOSTS = new Set([
  "pomopal.lol",
  "www.pomopal.lol",
  "pomopal.vercel.app",
]);

/**
 * Socket.IO host. Production uses site origin; Engine.IO path is /api/socket.io
 * (vercel.json /api/:path* → EC2, same strip-prefix as REST).
 */
export function getSocketBaseUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
    if (PRODUCTION_HOSTS.has(hostname)) {
      return origin;
    }
  }

  return getApiBaseUrl();
}

/** Engine.IO path. Production: /api/socket.io (proxied with REST). Local direct backend: /socket.io */
export function getSocketPath() {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return "/socket.io";
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (PRODUCTION_HOSTS.has(hostname)) return "/api/socket.io";
    if (hostname === "localhost" || hostname === "127.0.0.1") return "/socket.io";
  }
  return "/socket.io";
}

/** True when Socket.IO goes through Vercel /api/socket.io proxy (no WebSocket upgrade). */
export function usesVercelSocketProxy() {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return false;
  if (typeof window === "undefined") return false;
  return PRODUCTION_HOSTS.has(window.location.hostname);
}

/**
 * Vercel rewrites proxy HTTP long-polling but not WebSocket upgrades.
 * Use polling-only on pomopal.lol; use WebSocket when hitting the backend directly.
 */
export function getSocketClientOptions() {
  if (usesVercelSocketProxy()) {
    return { transports: ["polling"], upgrade: false };
  }
  return { transports: ["polling", "websocket"] };
}
