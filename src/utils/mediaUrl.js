import { getApiBaseUrl } from "./apiBase";

export const S3_PUBLIC_BASE = (
  process.env.NEXT_PUBLIC_S3_BASE_URL || "https://pomopal.s3.us-east-2.amazonaws.com"
).replace(/\/$/, "");

const TEMPLATE_KEY_PREFIX = "notification-templates/";

function s3TemplateUrl(key) {
  const normalized = key.startsWith(TEMPLATE_KEY_PREFIX)
    ? key
    : `${TEMPLATE_KEY_PREFIX}${key.replace(/^\/+/, "")}`;
  return `${S3_PUBLIC_BASE}/${normalized}`;
}

function keyFromUrl(pathname) {
  const path = pathname.replace(/^\//, "").replace(/^(api\/)?media\//, "");
  if (path.startsWith(TEMPLATE_KEY_PREFIX)) return path;
  const legacy = path.match(/^storage\/templates\/(.+)$/);
  if (legacy) return `${TEMPLATE_KEY_PREFIX}${legacy[1]}`;
  return null;
}

/**
 * Resolve template image paths for <img src>.
 * API may return a full S3 URL, an S3 object key, a legacy /storage path,
 * or an old app /media proxy link — all are normalized to the public S3 URL.
 */
export function mediaUrl(path) {
  if (!path) return null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      const key = keyFromUrl(url.pathname);
      if (key) {
        const base = s3TemplateUrl(key);
        return url.search ? `${base}${url.search}` : base;
      }
    } catch {
      // not a valid URL — fall through
    }
    return path;
  }

  if (path.startsWith(TEMPLATE_KEY_PREFIX)) {
    return s3TemplateUrl(path);
  }

  const legacy = path.match(/(?:^|\/)storage\/templates\/(.+)$/);
  if (legacy) {
    return s3TemplateUrl(`${TEMPLATE_KEY_PREFIX}${legacy[1]}`);
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalized}`;
}

/**
 * Resolve blog cover / in-post image paths for <img> / next/image.
 * Accepts:
 * - full https:// URL (CDN or S3) → returned as-is
 * - site-relative `/...` (public/) → returned as-is
 * - S3 object key e.g. `blog/welcome-cover.webp` → `{S3_PUBLIC_BASE}/{key}`
 */
export function blogAssetUrl(path) {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `${S3_PUBLIC_BASE}/${trimmed.replace(/^\/+/, "")}`;
}
