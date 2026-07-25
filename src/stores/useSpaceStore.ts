import type { CSSProperties } from "react";
import { create } from "zustand";

export type BackgroundType = "solid" | "image";

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

export type TimerFontValue = (typeof TIMER_FONTS)[number]["value"];

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

/**
 * CSS-ready timer box styles. Only typed CSS fields — never arbitrary CSS strings
 * from user input beyond allowlisted / sanitized values.
 */
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
}

export interface SpaceAppearance {
  spaceName: string;
  backgroundType: BackgroundType;
  backgroundColor: string;
  /** Local filename shown in the upload UI only — no upload yet */
  backgroundImageName: string | null;
  timerFont: TimerFontValue;
  timerFontSize: number;
  timerColor: string;
  timerAnchor: TimerAnchor;
  /** Fine-tune offsets in px (applied via CSS transform) */
  timerOffsetX: number;
  timerOffsetY: number;
  /** Box scale: 0.5–1.5 → stored/applied as CSS scale() */
  timerScale: number;
}

interface SpaceState extends SpaceAppearance {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSpaceName: (name: string) => void;
  setBackgroundType: (type: BackgroundType) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImageName: (name: string | null) => void;
  setTimerFont: (font: TimerFontValue) => void;
  setTimerFontSize: (size: number) => void;
  setTimerColor: (color: string) => void;
  setTimerAnchor: (anchor: TimerAnchor) => void;
  setTimerOffsetX: (x: number) => void;
  setTimerOffsetY: (y: number) => void;
  setTimerScale: (scale: number) => void;
  resetAppearance: () => void;
}

const DEFAULT_COLOR = "#111827";
const DEFAULT_TIMER_COLOR = "#ffffff";
const EDGE_INSET = "1.5rem";

function isAllowedFont(font: string): font is TimerFontValue {
  return TIMER_FONTS.some((entry) => entry.value === font);
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

/** Build absolute-position CSS for the timer box from typed appearance fields. */
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

/** Build text CSS for the countdown digits from typed appearance fields. */
export function buildTimerTextCss(appearance: SpaceAppearance): TimerTextCss {
  const css: TimerTextCss = {
    fontSize: `clamp(2.5rem, ${appearance.timerFontSize * 0.2}vw, ${appearance.timerFontSize}px)`,
    color: appearance.timerColor,
  };
  if (appearance.timerFont !== "inherit") {
    css.fontFamily = appearance.timerFont;
  }
  return css;
}

/** Page background CSS from typed appearance fields. */
export function buildBackgroundCss(
  appearance: Pick<SpaceAppearance, "backgroundType" | "backgroundColor">
): CSSProperties {
  if (appearance.backgroundType === "solid") {
    return { backgroundColor: appearance.backgroundColor };
  }
  return {};
}

export const useSpaceStore = create<SpaceState>((set) => ({
  sidebarOpen: false,
  spaceName: "",
  backgroundType: "solid",
  backgroundColor: DEFAULT_COLOR,
  backgroundImageName: null,
  timerFont: "inherit",
  timerFontSize: 96,
  timerColor: DEFAULT_TIMER_COLOR,
  timerAnchor: "center",
  timerOffsetX: 0,
  timerOffsetY: 0,
  timerScale: 1,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSpaceName: (name) => set({ spaceName: sanitizeSpaceName(name) }),

  setBackgroundType: (type) => set({ backgroundType: type }),

  setBackgroundColor: (color) =>
    set({ backgroundColor: sanitizeColor(color, DEFAULT_COLOR) }),

  setBackgroundImageName: (name) => set({ backgroundImageName: name }),

  setTimerFont: (font) => {
    if (!isAllowedFont(font)) return;
    set({ timerFont: font });
  },

  setTimerFontSize: (size) => {
    if (!Number.isFinite(size)) return;
    set({ timerFontSize: Math.min(160, Math.max(32, Math.round(size))) });
  },

  setTimerColor: (color) =>
    set({ timerColor: sanitizeColor(color, DEFAULT_TIMER_COLOR) }),

  setTimerAnchor: (anchor) => set({ timerAnchor: anchor }),

  setTimerOffsetX: (x) => {
    if (!Number.isFinite(x)) return;
    set({ timerOffsetX: Math.min(800, Math.max(-800, Math.round(x))) });
  },

  setTimerOffsetY: (y) => {
    if (!Number.isFinite(y)) return;
    set({ timerOffsetY: Math.min(600, Math.max(-600, Math.round(y))) });
  },

  setTimerScale: (scale) => {
    if (!Number.isFinite(scale)) return;
    set({
      timerScale: Math.min(1.5, Math.max(0.5, Math.round(scale * 100) / 100)),
    });
  },

  resetAppearance: () =>
    set({
      spaceName: "",
      backgroundType: "solid",
      backgroundColor: DEFAULT_COLOR,
      backgroundImageName: null,
      timerFont: "inherit",
      timerFontSize: 96,
      timerColor: DEFAULT_TIMER_COLOR,
      timerAnchor: "center",
      timerOffsetX: 0,
      timerOffsetY: 0,
      timerScale: 1,
    }),
}));
