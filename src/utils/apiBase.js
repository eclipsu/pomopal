/**
 * API base URL for axios / socket.io.
 * On pomopal.lol / www.pomopal.lol use same-origin /api (Vercel rewrite) to avoid CORS.
 */
export function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "pomopal.lol" || host === "www.pomopal.lol") {
      return `${window.location.origin}/api`;
    }
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  return "http://localhost:8000";
}
