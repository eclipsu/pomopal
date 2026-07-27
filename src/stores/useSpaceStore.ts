import type { CSSProperties } from "react";
import { create } from "zustand";
import {
  clearActiveSpace,
  readActiveSpace,
  writeActiveSpace,
} from "@/lib/activeSpaceStorage";

export type BackgroundType = "solid" | "image" | "gif";

/** How image/GIF backgrounds paint on the viewport. */
export type BackgroundFit = "fill" | "fit" | "stretch" | "tile";

export const BACKGROUND_FITS: { value: BackgroundFit; label: string }[] = [
  { value: "fill", label: "Fill" },
  { value: "fit", label: "Fit" },
  { value: "stretch", label: "Stretch" },
  { value: "tile", label: "Tile" },
];

export type TimerAnchor =
  | "top-left"
  | "top"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

/** Allowlisted fonts only — style data may later come from other users. */
export const TIMER_FONTS = [
  { value: "inherit", label: "Default" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: '"Courier New", monospace', label: "Courier" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: '"Trebuchet MS", sans-serif', label: "Trebuchet" },
  { value: "Verdana, sans-serif", label: "Verdana" },
] as const;

export type TimerFontValue = string;

export const TIMER_ANCHORS: { id: TimerAnchor; label: string }[] = [
  { id: "top-left", label: "Top left" },
  { id: "top", label: "Top" },
  { id: "top-right", label: "Top right" },
  { id: "middle-left", label: "Middle left" },
  { id: "center", label: "Center" },
  { id: "middle-right", label: "Middle right" },
  { id: "bottom-left", label: "Bottom left" },
  { id: "bottom", label: "Bottom" },
  { id: "bottom-right", label: "Bottom right" },
];

export interface TimerBoxCss {
  position: "absolute";
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  transform: string;
  transformOrigin: string;
  width: string;
  maxWidth: string;
}

export interface TimerTextCss {
  fontFamily?: string;
  fontSize: string;
  color: string;
  lineHeight?: number | string;
}

export interface SpaceAppearance {
  spaceName: string;
  backgroundType: BackgroundType;
  backgroundColor: string;
  backgroundImageName: string | null;
  backgroundImageUrl: string | null;
  backgroundFit: BackgroundFit;
  backgroundGifUrl: string | null;
  backgroundGifPreviewUrl: string | null;
  backgroundGifId: string | null;
  timerFont: TimerFontValue;
  timerFontSize: number;
  timerColor: string;
  timerAnchor: TimerAnchor;
  timerOffsetX: number;
  timerOffsetY: number;
  timerScale: number;
  ringSoundId: string | null;
  focusSoundId: string | null;
}

interface SpaceState extends SpaceAppearance {
  sidebarOpen: boolean;
  /** Persisted space id when this is your saved space */
  spaceId: string | null;
  spaceSlug: string | null;
  spacePath: string | null;
  spaceVisibility: "private" | "friends" | "public" | null;
  spaceStarCount: number;
  spaceForkCount: number;
  spaceStarredByMe: boolean;
  /** False when using someone else's space without forking */
  spaceCanEdit: boolean;
  /** Owner username for share links */
  spaceOwnerUsername: string | null;
  spaceTags: string[];
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSpaceName: (name: string) => void;
  setSpaceMeta: (meta: {
    spaceId?: string | null;
    spaceSlug?: string | null;
    spacePath?: string | null;
    spaceVisibility?: SpaceState["spaceVisibility"];
    spaceStarCount?: number;
    spaceForkCount?: number;
    spaceStarredByMe?: boolean;
    spaceCanEdit?: boolean;
    spaceOwnerUsername?: string | null;
    spaceTags?: string[];
  }) => void;
  setRingSoundId: (id: string | null) => void;
  setFocusSoundId: (id: string | null) => void;
  setBackgroundType: (type: BackgroundType) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImageName: (name: string | null) => void;
  setBackgroundImageUrl: (url: string | null) => void;
  setBackgroundFit: (fit: BackgroundFit) => void;
  setBackgroundGif: (gif: {
    id: string;
    url: string;
    previewUrl: string;
  } | null) => void;
  setTimerFont: (font: TimerFontValue) => void;
  setTimerFontSize: (size: number) => void;
  setTimerColor: (color: string) => void;
  setTimerAnchor: (anchor: TimerAnchor) => void;
  setTimerOffsetX: (x: number) => void;
  setTimerOffsetY: (y: number) => void;
  setTimerScale: (scale: number) => void;
  applyAppearance: (patch: Partial<SpaceAppearance>) => void;
  resetAppearance: () => void;
}

const DEFAULT_COLOR = "#111827";
const DEFAULT_TIMER_COLOR = "#ffffff";
const EDGE_INSET = "1.5rem";

const CUSTOM_FONT_RE =
  /^font:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isAllowedFont(font: string): font is TimerFontValue {
  return (
    TIMER_FONTS.some((entry) => entry.value === font) || CUSTOM_FONT_RE.test(font)
  );
}

/** Resolve timerFont token → CSS font-family using optional custom map. */
export function resolveTimerFontFamily(
  timerFont: string,
  customFonts?: Array<{ id: string; family_name: string; token?: string }>,
): string | undefined {
  if (!timerFont || timerFont === "inherit") return undefined;
  if (TIMER_FONTS.some((f) => f.value === timerFont)) return timerFont;
  const m = /^font:([0-9a-f-]{36})$/i.exec(timerFont);
  if (m && customFonts?.length) {
    const id = m[1].toLowerCase();
    const row = customFonts.find(
      (f) => f.id.toLowerCase() === id || f.token === timerFont,
    );
    if (row?.family_name) return `"${row.family_name}"`;
  }
  return undefined;
}

export function buildTimerTextCss(
  appearance: SpaceAppearance,
  customFonts?: Array<{ id: string; family_name: string; token?: string }>,
): TimerTextCss {
  const css: TimerTextCss = {
    fontSize: `clamp(1.75rem, min(${appearance.timerFontSize * 0.18}vw, ${appearance.timerFontSize * 0.14}vh, ${appearance.timerFontSize * 0.22}vmin), ${appearance.timerFontSize}px)`,
    color: appearance.timerColor,
    lineHeight: 1,
  };
  const family = resolveTimerFontFamily(appearance.timerFont, customFonts);
  if (family) css.fontFamily = family;
  return css;
}

function sanitizeColor(color: string, fallback: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(color) || /^#[0-9A-Fa-f]{3}$/.test(color)) {
    return color;
  }
  return fallback;
}

function sanitizeSpaceName(name: string): string {
  return name.slice(0, 48);
}

function isHttpsUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function buildTimerBoxCss(appearance: SpaceAppearance): TimerBoxCss {
  const x = Math.round(appearance.timerOffsetX);
  const y = Math.round(appearance.timerOffsetY);
  const scale = appearance.timerScale;
  const anchor = appearance.timerAnchor;

  const base: TimerBoxCss = {
    position: "absolute",
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    transformOrigin: "center center",
    width: "100%",
    maxWidth: "32rem",
  };

  switch (anchor) {
    case "top-left":
      return {
        ...base,
        top: EDGE_INSET,
        left: EDGE_INSET,
        transformOrigin: "top left",
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
      };
    case "top":
      return {
        ...base,
        top: EDGE_INSET,
        left: "50%",
        transformOrigin: "top center",
        transform: `translate(calc(-50% + ${x}px), ${y}px) scale(${scale})`,
      };
    case "top-right":
      return {
        ...base,
        top: EDGE_INSET,
        right: EDGE_INSET,
        transformOrigin: "top right",
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
      };
    case "middle-left":
      return {
        ...base,
        top: "50%",
        left: EDGE_INSET,
        transformOrigin: "center left",
        transform: `translate(${x}px, calc(-50% + ${y}px)) scale(${scale})`,
      };
    case "center":
      return {
        ...base,
        top: "50%",
        left: "50%",
        transformOrigin: "center center",
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
      };
    case "middle-right":
      return {
        ...base,
        top: "50%",
        right: EDGE_INSET,
        transformOrigin: "center right",
        transform: `translate(${x}px, calc(-50% + ${y}px)) scale(${scale})`,
      };
    case "bottom-left":
      return {
        ...base,
        bottom: EDGE_INSET,
        left: EDGE_INSET,
        transformOrigin: "bottom left",
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
      };
    case "bottom":
      return {
        ...base,
        bottom: EDGE_INSET,
        left: "50%",
        transformOrigin: "bottom center",
        transform: `translate(calc(-50% + ${x}px), ${y}px) scale(${scale})`,
      };
    case "bottom-right":
      return {
        ...base,
        bottom: EDGE_INSET,
        right: EDGE_INSET,
        transformOrigin: "bottom right",
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
      };
    default: {
      const _exhaustive: never = anchor;
      return { ...base, top: "50%", left: "50%", transform: String(_exhaustive) };
    }
  }
}

function isAllowedFit(fit: string): fit is BackgroundFit {
  return BACKGROUND_FITS.some((entry) => entry.value === fit);
}

function fitCss(fit: BackgroundFit): Pick<
  CSSProperties,
  "backgroundSize" | "backgroundRepeat" | "backgroundPosition"
> {
  switch (fit) {
    case "fit":
      return {
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      };
    case "stretch":
      return {
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      };
    case "tile":
      return {
        backgroundSize: "auto",
        backgroundRepeat: "repeat",
        backgroundPosition: "top left",
      };
    case "fill":
    default:
      return {
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      };
  }
}

export function buildBackgroundCss(
  appearance: Pick<
    SpaceAppearance,
    | "backgroundType"
    | "backgroundColor"
    | "backgroundImageUrl"
    | "backgroundGifUrl"
    | "backgroundFit"
  >,
): CSSProperties {
  const fit = isAllowedFit(appearance.backgroundFit)
    ? appearance.backgroundFit
    : "fill";

  if (appearance.backgroundType === "solid") {
    return { backgroundColor: appearance.backgroundColor };
  }
  if (appearance.backgroundType === "image" && appearance.backgroundImageUrl) {
    return {
      backgroundColor: appearance.backgroundColor,
      backgroundImage: `url(${appearance.backgroundImageUrl})`,
      ...fitCss(fit),
    };
  }
  if (appearance.backgroundType === "gif" && appearance.backgroundGifUrl) {
    return {
      backgroundColor: appearance.backgroundColor,
      backgroundImage: `url(${appearance.backgroundGifUrl})`,
      ...fitCss(fit),
    };
  }
  return { backgroundColor: appearance.backgroundColor || DEFAULT_COLOR };
}

const DEFAULT_APPEARANCE: SpaceAppearance = {
  spaceName: "",
  backgroundType: "solid",
  backgroundColor: DEFAULT_COLOR,
  backgroundImageName: null,
  backgroundImageUrl: null,
  backgroundFit: "fill",
  backgroundGifUrl: null,
  backgroundGifPreviewUrl: null,
  backgroundGifId: null,
  timerFont: "inherit",
  timerFontSize: 96,
  timerColor: DEFAULT_TIMER_COLOR,
  timerAnchor: "center",
  timerOffsetX: 0,
  timerOffsetY: 0,
  timerScale: 1,
  ringSoundId: null,
  focusSoundId: null,
};

export const useSpaceStore = create<SpaceState>((set, get) => ({
  sidebarOpen: false,
  spaceId: null,
  spaceSlug: null,
  spacePath: null,
  spaceVisibility: null,
  spaceStarCount: 0,
  spaceForkCount: 0,
  spaceStarredByMe: false,
  spaceCanEdit: true,
  spaceOwnerUsername: null,
  spaceTags: [],
  ...DEFAULT_APPEARANCE,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSpaceName: (name) => {
    if (!get().spaceCanEdit) return;
    set({ spaceName: sanitizeSpaceName(name) });
  },

  setSpaceMeta: (meta) =>
    set({
      ...(meta.spaceId !== undefined ? { spaceId: meta.spaceId } : {}),
      ...(meta.spaceSlug !== undefined ? { spaceSlug: meta.spaceSlug } : {}),
      ...(meta.spacePath !== undefined ? { spacePath: meta.spacePath } : {}),
      ...(meta.spaceVisibility !== undefined
        ? { spaceVisibility: meta.spaceVisibility }
        : {}),
      ...(meta.spaceStarCount !== undefined
        ? { spaceStarCount: meta.spaceStarCount }
        : {}),
      ...(meta.spaceForkCount !== undefined
        ? { spaceForkCount: meta.spaceForkCount }
        : {}),
      ...(meta.spaceStarredByMe !== undefined
        ? { spaceStarredByMe: meta.spaceStarredByMe }
        : {}),
      ...(meta.spaceCanEdit !== undefined
        ? { spaceCanEdit: meta.spaceCanEdit }
        : {}),
      ...(meta.spaceOwnerUsername !== undefined
        ? { spaceOwnerUsername: meta.spaceOwnerUsername }
        : {}),
      ...(meta.spaceTags !== undefined ? { spaceTags: meta.spaceTags } : {}),
    }),

  setRingSoundId: (id) => {
    if (!get().spaceCanEdit) return;
    set({ ringSoundId: id });
  },
  setFocusSoundId: (id) => {
    if (!get().spaceCanEdit) return;
    set({ focusSoundId: id });
  },

  setBackgroundType: (type) => {
    if (!get().spaceCanEdit) return;
    set({ backgroundType: type });
  },

  setBackgroundColor: (color) => {
    if (!get().spaceCanEdit) return;
    set({ backgroundColor: sanitizeColor(color, DEFAULT_COLOR) });
  },

  setBackgroundImageName: (name) => {
    if (!get().spaceCanEdit) return;
    set({ backgroundImageName: name });
  },

  setBackgroundImageUrl: (url) => {
    if (!get().spaceCanEdit) return;
    set({ backgroundImageUrl: isHttpsUrl(url) });
  },

  setBackgroundFit: (fit) => {
    if (!get().spaceCanEdit) return;
    if (!isAllowedFit(fit)) return;
    set({ backgroundFit: fit });
  },

  setBackgroundGif: (gif) => {
    if (!get().spaceCanEdit) return;
    if (!gif) {
      set({
        backgroundGifUrl: null,
        backgroundGifPreviewUrl: null,
        backgroundGifId: null,
      });
      return;
    }
    const url = isHttpsUrl(gif.url);
    const previewUrl = isHttpsUrl(gif.previewUrl);
    if (!url) return;
    set({
      backgroundType: "gif",
      backgroundGifUrl: url,
      backgroundGifPreviewUrl: previewUrl,
      backgroundGifId: String(gif.id).slice(0, 64),
    });
  },

  setTimerFont: (font) => {
    if (!get().spaceCanEdit) return;
    if (!isAllowedFont(font)) return;
    set({ timerFont: font });
  },

  setTimerFontSize: (size) => {
    if (!get().spaceCanEdit) return;
    if (!Number.isFinite(size)) return;
    set({ timerFontSize: Math.min(160, Math.max(32, Math.round(size))) });
  },

  setTimerColor: (color) => {
    if (!get().spaceCanEdit) return;
    set({ timerColor: sanitizeColor(color, DEFAULT_TIMER_COLOR) });
  },

  setTimerAnchor: (anchor) => {
    if (!get().spaceCanEdit) return;
    set({ timerAnchor: anchor });
  },

  setTimerOffsetX: (x) => {
    if (!get().spaceCanEdit) return;
    if (!Number.isFinite(x)) return;
    set({ timerOffsetX: Math.min(800, Math.max(-800, Math.round(x))) });
  },

  setTimerOffsetY: (y) => {
    if (!get().spaceCanEdit) return;
    if (!Number.isFinite(y)) return;
    set({ timerOffsetY: Math.min(600, Math.max(-600, Math.round(y))) });
  },

  setTimerScale: (scale) => {
    if (!get().spaceCanEdit) return;
    if (!Number.isFinite(scale)) return;
    set({
      timerScale: Math.min(1.5, Math.max(0.5, Math.round(scale * 100) / 100)),
    });
  },

  /** Apply a remote layout (Use / fork load) — allowed even when read-only. */
  applyAppearance: (patch) => {
    set({ ...patch });
    writeActiveSpace(get());
  },

  resetAppearance: () => {
    set({
      ...DEFAULT_APPEARANCE,
      spaceId: null,
      spaceSlug: null,
      spacePath: null,
      spaceVisibility: null,
      spaceStarCount: 0,
      spaceForkCount: 0,
      spaceStarredByMe: false,
      spaceCanEdit: true,
      spaceOwnerUsername: null,
      spaceTags: [],
    });
    clearActiveSpace();
  },
}));

function persistActiveSpace() {
  writeActiveSpace(useSpaceStore.getState());
}

/** Hydrate last-used space from localStorage (client only). */
function hydrateActiveSpaceFromStorage() {
  if (typeof window === "undefined") return;
  const saved = readActiveSpace();
  if (!saved) return;
  const {
    v: _v,
    ...rest
  } = saved;
  useSpaceStore.setState({
    ...rest,
    sidebarOpen: false,
  });
}

if (typeof window !== "undefined") {
  hydrateActiveSpaceFromStorage();
  useSpaceStore.subscribe(() => {
    persistActiveSpace();
  });
}
