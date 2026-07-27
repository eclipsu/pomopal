const STORAGE_KEY = "pomopalActiveSpace";
const VERSION = 1;

const APPEARANCE_KEYS = [
  "spaceName",
  "backgroundType",
  "backgroundColor",
  "backgroundImageName",
  "backgroundImageUrl",
  "backgroundFit",
  "backgroundGifUrl",
  "backgroundGifPreviewUrl",
  "backgroundGifId",
  "timerFont",
  "timerFontSize",
  "timerColor",
  "timerAnchor",
  "timerOffsetX",
  "timerOffsetY",
  "timerScale",
  "ringSoundId",
  "focusSoundId",
];

const META_KEYS = [
  "spaceId",
  "spaceSlug",
  "spacePath",
  "spaceVisibility",
  "spaceStarCount",
  "spaceForkCount",
  "spaceStarredByMe",
  "spaceCanEdit",
  "spaceOwnerUsername",
  "spaceTags",
];

export function snapshotActiveSpace(state) {
  if (!state) return null;
  const snap = { v: VERSION };
  for (const key of APPEARANCE_KEYS) {
    snap[key] = state[key];
  }
  for (const key of META_KEYS) {
    snap[key] = state[key];
  }
  return snap;
}

export function readActiveSpace() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeActiveSpace(state) {
  if (typeof window === "undefined") return;
  try {
    const snap = snapshotActiveSpace(state);
    if (!snap) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    // quota / private mode
  }
}

export function clearActiveSpace() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
