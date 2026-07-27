import axiosClient from "@/utils/axios";
import { getApiBaseUrl, getUploadApiBaseUrl } from "@/utils/apiBase";
import { librarySoundStreamUrl } from "@/lib/librarySoundSelection";
import { resolveFontFaceUrl } from "@/lib/fontUrl";

/** Canonical public path: /username/spacename-uuid */
export function spacePath(space) {
  if (space?.path) return space.path;
  const username = space?.creator?.username;
  if (username && space?.slug) {
    return `/${username}/${space.slug}`;
  }
  if (space?.slug) return `/spaces/${space.slug}`;
  return "/spaces";
}

export async function browseSpaces({ q = "", limit = 24, offset = 0 } = {}) {
  const { data } = await axiosClient.get("/spaces", {
    params: { q: q || undefined, limit, offset, _ts: Date.now() },
  });
  return data;
}

export async function getSpaceBySlug(slug) {
  const { data } = await axiosClient.get(
    `/spaces/by-slug/${encodeURIComponent(slug)}`,
  );
  return data;
}

export async function getSpaceByUsernameAndSlug(username, spaceSlug) {
  const { data } = await axiosClient.get(
    `/profiles/${encodeURIComponent(username)}/spaces/${encodeURIComponent(spaceSlug)}`,
  );
  return data;
}

const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;

function profileCacheKey(username) {
  return `pomopal:profile:v3:${String(username).toLowerCase()}`;
}

/** Sync read of browser profile cache (null if missing/expired). */
export function peekProfileCache(username) {
  if (typeof window === "undefined" || !username) return null;
  try {
    const raw = sessionStorage.getItem(profileCacheKey(username));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached?.expiresAt > Date.now() && cached?.data) return cached.data;
  } catch {
    // ignore
  }
  return null;
}

/** Drop browser profile cache so /spaces and /{username} show fresh space cards. */
export function invalidateProfileCache(username) {
  if (typeof window === "undefined") return;
  try {
    if (username) {
      sessionStorage.removeItem(profileCacheKey(username));
      return;
    }
    const prefix = "pomopal:profile:";
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(prefix)) sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export async function getProfile(username, { force = false } = {}) {
  if (!force) {
    const cached = peekProfileCache(username);
    if (cached) return cached;
  }

  const { data } = await axiosClient.get(
    `/profiles/${encodeURIComponent(username)}`,
  );

  if (typeof window !== "undefined" && data) {
    try {
      sessionStorage.setItem(
        profileCacheKey(username),
        JSON.stringify({
          expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
          data,
        }),
      );
    } catch {
      // quota / private mode
    }
  }

  return data;
}

export async function recordSpaceView(slug) {
  const { data } = await axiosClient.post(
    `/spaces/by-slug/${encodeURIComponent(slug)}/view`,
  );
  return data;
}

export async function starSpace(slug) {
  const { data } = await axiosClient.post(
    `/spaces/by-slug/${encodeURIComponent(slug)}/star`,
  );
  return data;
}

export async function unstarSpace(slug) {
  const { data } = await axiosClient.delete(
    `/spaces/by-slug/${encodeURIComponent(slug)}/star`,
  );
  return data;
}

export async function listMySpaces() {
  const { data } = await axiosClient.get("/spaces/mine");
  // Back-compat if an older API still returns a bare array
  if (Array.isArray(data)) {
    return {
      items: data,
      count: data.length,
      limit: 4,
      can_create: data.length < 4,
    };
  }
  return data;
}

export async function createSpace(payload) {
  const { data } = await axiosClient.post("/spaces", payload);
  return data;
}

export async function updateSpace(id, payload) {
  const { data } = await axiosClient.patch(`/spaces/${id}`, payload);
  return data;
}

export async function deleteSpace(id) {
  const { data } = await axiosClient.delete(`/spaces/${id}`);
  return data;
}

export async function publishSpace(id, visibility = "public") {
  const { data } = await axiosClient.post(`/spaces/${id}/publish`, {
    visibility,
  });
  return data;
}

export async function unpublishSpace(id) {
  const { data } = await axiosClient.post(`/spaces/${id}/unpublish`);
  return data;
}

export async function remixSpace(slug) {
  const { data } = await axiosClient.post(
    `/spaces/by-slug/${encodeURIComponent(slug)}/remix`,
  );
  return data;
}

export async function searchGiphy(q, { limit = 16, offset = 0 } = {}) {
  const { data } = await axiosClient.get("/giphy/search", {
    params: { q, limit, offset },
  });
  return data;
}

export async function featuredGiphy({ limit = 16, offset = 0 } = {}) {
  const { data } = await axiosClient.get("/giphy/featured", {
    params: { limit, offset },
  });
  return data;
}

/**
 * Resolve space default sound IDs for persistence.
 * Store IDs win when set; otherwise capture the live prefs the sidebar shows.
 */
export function resolveSpaceSoundIds(appearance, prefs) {
  const ringFromPrefs =
    prefs?.ring?.selection?.kind === "library"
      ? prefs.ring.selection.id
      : null;
  const focusFromPrefs =
    prefs?.background?.enabled &&
    prefs?.background?.selection?.kind === "library"
      ? prefs.background.selection.id
      : null;

  const ringSoundId =
    typeof appearance?.ringSoundId === "string"
      ? appearance.ringSoundId
      : ringFromPrefs;
  const focusSoundId =
    typeof appearance?.focusSoundId === "string"
      ? appearance.focusSoundId
      : focusFromPrefs;

  return {
    ringSoundId: ringSoundId || null,
    focusSoundId: focusSoundId || null,
  };
}

/** Map Zustand appearance → API layout payload */
export function appearanceToLayout(appearance, prefs) {
  const { ringSoundId, focusSoundId } = resolveSpaceSoundIds(
    appearance,
    prefs,
  );
  return {
    backgroundType: appearance.backgroundType,
    backgroundColor: appearance.backgroundColor,
    backgroundImageUrl: appearance.backgroundImageUrl ?? null,
    backgroundFit: appearance.backgroundFit ?? "fill",
    backgroundGifUrl: appearance.backgroundGifUrl ?? null,
    backgroundGifPreviewUrl: appearance.backgroundGifPreviewUrl ?? null,
    backgroundGifId: appearance.backgroundGifId ?? null,
    timerFont: appearance.timerFont,
    timerFontSize: appearance.timerFontSize,
    timerColor: appearance.timerColor,
    timerAnchor: appearance.timerAnchor,
    timerOffsetX: appearance.timerOffsetX,
    timerOffsetY: appearance.timerOffsetY,
    timerScale: appearance.timerScale,
    ringSoundId,
    focusSoundId,
  };
}

export function layoutToAppearancePatch(layout, title) {
  return {
    spaceName: title ?? "",
    backgroundType: layout.backgroundType ?? "solid",
    backgroundColor: layout.backgroundColor ?? "#111827",
    backgroundImageUrl: layout.backgroundImageUrl ?? null,
    backgroundImageName: null,
    backgroundFit: layout.backgroundFit ?? "fill",
    backgroundGifUrl: layout.backgroundGifUrl ?? null,
    backgroundGifPreviewUrl: layout.backgroundGifPreviewUrl ?? null,
    backgroundGifId: layout.backgroundGifId ?? null,
    timerFont: layout.timerFont ?? "inherit",
    timerFontSize: layout.timerFontSize ?? 96,
    timerColor: layout.timerColor ?? "#ffffff",
    timerAnchor: layout.timerAnchor ?? "center",
    timerOffsetX: layout.timerOffsetX ?? 0,
    timerOffsetY: layout.timerOffsetY ?? 0,
    timerScale: layout.timerScale ?? 1,
    ringSoundId: layout.ringSoundId ?? null,
    focusSoundId: layout.focusSoundId ?? null,
  };
}

/**
 * Apply library sound IDs from a space layout into live sound prefs.
 * @param {{ clearMissing?: boolean }} [options] When clearMissing (default true),
 *   null IDs reset prefs to built-in default / no focus sound.
 */
export function applyLayoutSounds(
  layout,
  { updateBackground, updateRing },
  options = {},
) {
  if (!layout) return;
  const clearMissing = options.clearMissing !== false;

  if (layout.ringSoundId) {
    updateRing({
      selection: {
        kind: "library",
        id: layout.ringSoundId,
        name: "Space alarm",
        source: "s3",
        streamUrl: librarySoundStreamUrl(layout.ringSoundId),
      },
    });
  } else if (clearMissing) {
    updateRing({ selection: null });
  }

  if (layout.focusSoundId) {
    updateBackground({
      enabled: true,
      selection: {
        kind: "library",
        id: layout.focusSoundId,
        name: "Space focus",
        source: "s3",
        streamUrl: librarySoundStreamUrl(layout.focusSoundId),
      },
    });
  } else if (clearMissing) {
    updateBackground({ enabled: false, selection: null });
  }
}

/**
 * Apply a server-baked space snapshot (preferred over live library lookups).
 * Font face URL + sound stream paths are already resolved at bake time.
 */
export function applyBakedSpace(
  baked,
  { applyAppearance, updateBackground, updateRing, title },
) {
  if (!baked?.layout) return null;

  applyAppearance(layoutToAppearancePatch(baked.layout, title));

  if (baked.ring?.id) {
    updateRing({
      selection: {
        kind: "library",
        id: baked.ring.id,
        name: baked.ring.name || "Space alarm",
        source: "s3",
        streamUrl: baked.ring.streamPath
          ? absoluteApiUrl(baked.ring.streamPath)
          : librarySoundStreamUrl(baked.ring.id),
      },
    });
  } else {
    updateRing({ selection: null });
  }

  if (baked.focus?.id) {
    updateBackground({
      enabled: true,
      selection: {
        kind: "library",
        id: baked.focus.id,
        name: baked.focus.name || "Space focus",
        source: "s3",
        streamUrl: baked.focus.streamPath
          ? absoluteApiUrl(baked.focus.streamPath)
          : librarySoundStreamUrl(baked.focus.id),
      },
    });
  } else {
    updateBackground({ enabled: false, selection: null });
  }

  return baked.font
    ? {
        ...baked.font,
        // Prefer baked proxy path; family required for @font-face.
        url: baked.font.url,
      }
    : null;
}

function absoluteApiUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = String(getApiBaseUrl() || "").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Ensure a baked (or library) custom font is loaded via @font-face. */
export function ensureSpaceFontFace(font) {
  if (typeof document === "undefined" || !font?.family) return;
  const src = resolveFontFaceUrl(font.url, font.id);
  if (!src) return;
  const id = `pomopal-font-${font.family}`;
  const existing = document.getElementById(id);
  if (existing) {
    // Update src if we now have a better (proxied) URL.
    if (existing.textContent?.includes(src)) return;
    existing.remove();
  }
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    @font-face {
      font-family: "${font.family}";
      src: url("${src}") format("truetype");
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

export async function uploadSpaceBackground(file) {
  const fd = new FormData();
  fd.append("image", file);
  const { data } = await axiosClient.post("/spaces/upload-background", fd, {
    baseURL: getUploadApiBaseUrl(),
  });
  return data;
}
