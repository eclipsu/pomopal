const DEFAULT_APP_URL = "https://pomopal.lol";
const FALLBACK_OG_IMAGE = "/assets/tomato.png";

export function appBaseUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_APP_URL;
  return String(raw).replace(/\/$/, "");
}

export function backendBaseUrl() {
  const raw =
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000";
  return String(raw).replace(/\/$/, "");
}

/** Resolve path or absolute URL to a full https URL for OG scrapers. */
export function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return absoluteUrl(FALLBACK_OG_IMAGE);
  const value = String(pathOrUrl).trim();
  if (/^https?:\/\//i.test(value)) return value;
  const base = appBaseUrl();
  if (value.startsWith("/")) return `${base}${value}`;
  return `${base}/${value}`;
}

function formatFocusMinutes(minutes) {
  if (minutes == null) return null;
  const m = Math.round(Number(minutes));
  if (!Number.isFinite(m)) return null;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  return `${m}m`;
}

/**
 * Next.js Metadata for a public profile share / search result.
 */
export function profileShareMetadata(profile, path) {
  const username = profile?.username || "user";
  const name = profile?.name || username;
  const canonicalPath = path || `/${username}`;
  const url = absoluteUrl(canonicalPath);

  const bits = [];
  if (profile?.streak?.current_streak != null) {
    bits.push(`${profile.streak.current_streak}-day streak`);
  }
  const focus = formatFocusMinutes(profile?.all_time_focus_minutes);
  if (focus) bits.push(`${focus} focused`);
  const spaceCount = Array.isArray(profile?.spaces) ? profile.spaces.length : 0;
  if (spaceCount > 0) {
    bits.push(`${spaceCount} public space${spaceCount === 1 ? "" : "s"}`);
  }

  const title = `${name} (@${username}) · Pomopal`;
  const description =
    bits.length > 0
      ? `${name} on Pomopal — ${bits.join(" · ")}.`
      : `${name} (@${username}) on Pomopal — focus spaces and pomodoro stats.`;

  const image = absoluteUrl(profile?.avatar_url || FALLBACK_OG_IMAGE);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Pomopal",
      type: "profile",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function privateProfileMetadata() {
  return {
    title: "Profile · Pomopal",
    description: "This Pomopal profile is not publicly available.",
    robots: { index: false, follow: false },
  };
}

/**
 * Next.js Metadata for a public space share card.
 */
export function spaceShareMetadata(space, path) {
  const title = `${space?.title || "Space"} · Pomopal Space`;
  const creator =
    space?.creator?.name ||
    space?.creator?.username ||
    "a Pomopal user";
  const description =
    space?.description ||
    `Focus space by ${creator}${
      space?.tags?.length ? ` — ${space.tags.join(", ")}` : ""
    }`;
  const canonicalPath =
    path ||
    space?.path ||
    (space?.creator?.username && space?.slug
      ? `/${space.creator.username}/${space.slug}`
      : space?.slug
        ? `/spaces/${space.slug}`
        : "/spaces");
  const url = absoluteUrl(canonicalPath);
  const image = absoluteUrl(space?.cover_image_url || FALLBACK_OG_IMAGE);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Pomopal",
      type: "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/** Server-side fetch of a profile. Pass auth for friends-only views. */
export async function fetchPublicProfile(
  username,
  { revalidate = 60, cookie, bearer } = {},
) {
  if (!username) return { ok: false, status: 400, profile: null };
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const authed = Boolean(cookie || bearer);
  const res = await fetch(
    `${backendBaseUrl()}/profiles/${encodeURIComponent(username)}`,
    authed
      ? { headers, cache: "no-store" }
      : { headers, next: { revalidate } },
  );
  if (!res.ok) {
    return { ok: false, status: res.status, profile: null };
  }
  const profile = await res.json();
  return { ok: true, status: 200, profile };
}

export async function fetchSpaceBySlug(slug, { revalidate = 60 } = {}) {
  if (!slug) return { ok: false, status: 400, space: null };
  const res = await fetch(
    `${backendBaseUrl()}/spaces/by-slug/${encodeURIComponent(slug)}`,
    { next: { revalidate } },
  );
  if (!res.ok) return { ok: false, status: res.status, space: null };
  return { ok: true, status: 200, space: await res.json() };
}

export async function fetchSpaceByUsernameAndSlug(
  username,
  spaceSlug,
  { revalidate = 60 } = {},
) {
  if (!username || !spaceSlug) {
    return { ok: false, status: 400, space: null };
  }
  const res = await fetch(
    `${backendBaseUrl()}/profiles/${encodeURIComponent(username)}/spaces/${encodeURIComponent(spaceSlug)}`,
    { next: { revalidate } },
  );
  if (!res.ok) return { ok: false, status: res.status, space: null };
  return { ok: true, status: 200, space: await res.json() };
}
