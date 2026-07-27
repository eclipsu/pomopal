/**
 * Font face URLs live on the **frontend origin** (`/fonts/...`), not S3 and
 * not `/api`. Next rewrites `/fonts/*` → Nest, so @font-face is same-origin.
 */
export function resolveFontFaceUrl(urlOrPath, fontId) {
  if (!urlOrPath && !fontId) return null;

  // Prefer stable frontend path by library id.
  if (fontId) {
    return `/fonts/library/${fontId}/file`;
  }

  if (!urlOrPath) return null;

  // Already a frontend /fonts path (maybe with ?v=).
  if (urlOrPath.startsWith("/fonts/")) {
    return urlOrPath.split("?")[0];
  }

  // Absolute URL that already points at our frontend fonts route.
  try {
    if (/^https?:\/\//i.test(urlOrPath)) {
      const u = new URL(urlOrPath);
      if (u.pathname.startsWith("/fonts/")) {
        return u.pathname;
      }
      // Legacy baked S3 copy → frontend baked route.
      const baked = u.pathname.match(
        /\/spaces\/baked\/([0-9a-f-]{36})\/font\.ttf$/i,
      );
      if (baked) return `/fonts/baked/${baked[1]}/file`;
      // Legacy /api/fonts/... → strip /api
      if (u.pathname.startsWith("/api/fonts/")) {
        return u.pathname.slice("/api".length);
      }
    }
  } catch {
    // ignore
  }

  // Relative path like fonts/library/... without leading slash
  if (urlOrPath.startsWith("fonts/")) {
    return `/${urlOrPath.split("?")[0]}`;
  }

  return null;
}
