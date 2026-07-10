const VIDEO_ID_RE = /^[\w-]{11}$/;

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

function normalizeHost(hostname) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

/** Extract a YouTube video ID from a URL or bare ID string. */
export function extractYoutubeVideoId(input) {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) return null;

  if (VIDEO_ID_RE.test(trimmed)) return trimmed;

  let url;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) return null;

  const host = normalizeHost(url.hostname);

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return VIDEO_ID_RE.test(id) ? id : null;
  }

  const v = url.searchParams.get("v");
  if (v && VIDEO_ID_RE.test(v)) return v;

  const parts = url.pathname.split("/").filter(Boolean);
  const markerIdx = parts.findIndex((p) =>
    ["shorts", "embed", "v", "live"].includes(p),
  );
  if (markerIdx >= 0) {
    const id = parts[markerIdx + 1];
    if (id && VIDEO_ID_RE.test(id)) return id;
  }

  return null;
}

export function buildYoutubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
