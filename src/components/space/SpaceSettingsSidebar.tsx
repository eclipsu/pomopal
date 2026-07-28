"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  FolderOpen,
  GitFork,
  Globe2,
  Image as ImageIcon,
  Link2,
  Lock,
  Paintbrush,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Sparkles,
  Star,
  Tag,
  Timer,
  Trash2,
  Type,
  Users,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  BACKGROUND_FITS,
  TIMER_ANCHORS,
  TIMER_FONTS,
  useSpaceStore,
  type BackgroundFit,
  type BackgroundType,
  type TimerAnchor,
  type TimerFontValue,
} from "@/stores/useSpaceStore";
import { useSoundPreferences } from "@/hooks/useSoundPreferences";
import { useSoundLibrary } from "@/hooks/useSoundLibrary";
import { useFontLibrary } from "@/hooks/useFontLibrary";
import { prefetchAudioSelection } from "@/lib/audioCache";
import { selectionFromLibrarySound } from "@/lib/librarySoundSelection";
import { GiphyGifPicker } from "./GiphyGifPicker";
import {
  appearanceToLayout,
  applyLayoutSounds,
  applyBakedSpace,
  createSpace,
  deleteSpace,
  ensureSpaceFontFace,
  invalidateProfileCache,
  layoutToAppearancePatch,
  listMySpaces,
  publishSpace,
  remixSpace,
  resolveSpaceSoundIds,
  spacePath,
  starSpace,
  unstarSpace,
  updateSpace,
  uploadSpaceBackground,
} from "@/app/services/spaces";
import { useUser } from "@/hooks/useUser";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";

const SPACE_LIMIT = 4;

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold tracking-tight text-white">
      {Icon ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
          <Icon size={16} strokeWidth={2.25} />
        </span>
      ) : null}
      {children}
    </h2>
  );
}

function SelectField({
  value,
  onChange,
  children,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  "aria-label"?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#151b2b] px-3.5 py-2.5 text-[15px] text-white outline-none focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/40"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2393c5fd' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        paddingRight: "2rem",
      }}
    >
      {children}
    </select>
  );
}

function ConfigCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <h3 className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-blue-200">
        {Icon ? <Icon size={14} className="text-blue-300/90" /> : null}
        {title}
      </h3>
      {children}
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-[14px] text-white/70">{label}</span>
      {children}
    </div>
  );
}

function LabelWithIcon({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300/80">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/15 text-blue-300">
        <Icon size={12} />
      </span>
      {children}
    </span>
  );
}

function PositionMonitor({
  value,
  onChange,
}: {
  value: TimerAnchor;
  onChange: (anchor: TimerAnchor) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-full max-w-[12rem] rounded-xl border-2 border-blue-400/30 bg-[#0f1420] p-1.5 shadow-inner"
        role="group"
        aria-label="Timer position on screen"
      >
        <div className="grid grid-cols-3 gap-1">
          {TIMER_ANCHORS.map((anchor) => {
            const selected = value === anchor.id;
            return (
              <button
                key={anchor.id}
                type="button"
                title={anchor.label}
                aria-label={anchor.label}
                aria-pressed={selected}
                onClick={() => onChange(anchor.id)}
                className={`aspect-square rounded-md transition-colors ${
                  selected
                    ? "bg-blue-500 shadow-md shadow-blue-500/30"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              />
            );
          })}
        </div>
      </div>
      <div className="flex flex-col items-center" aria-hidden>
        <div className="h-2 w-8 rounded-b bg-blue-400/30" />
        <div className="h-1 w-14 rounded-full bg-blue-400/20" />
      </div>
      <p className="text-xs text-white/50">
        {TIMER_ANCHORS.find((a) => a.id === value)?.label ?? "Center"}
      </p>
    </div>
  );
}

function BackgroundPanel() {
  const backgroundType = useSpaceStore((s) => s.backgroundType);
  const backgroundColor = useSpaceStore((s) => s.backgroundColor);
  const backgroundImageName = useSpaceStore((s) => s.backgroundImageName);
  const backgroundImageUrl = useSpaceStore((s) => s.backgroundImageUrl);
  const backgroundFit = useSpaceStore((s) => s.backgroundFit);
  const backgroundGifId = useSpaceStore((s) => s.backgroundGifId);
  const backgroundGifPreviewUrl = useSpaceStore((s) => s.backgroundGifPreviewUrl);
  const setBackgroundType = useSpaceStore((s) => s.setBackgroundType);
  const setBackgroundColor = useSpaceStore((s) => s.setBackgroundColor);
  const setBackgroundImageName = useSpaceStore((s) => s.setBackgroundImageName);
  const setBackgroundImageUrl = useSpaceStore((s) => s.setBackgroundImageUrl);
  const setBackgroundFit = useSpaceStore((s) => s.setBackgroundFit);
  const setBackgroundGif = useSpaceStore((s) => s.setBackgroundGif);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const showFit =
    backgroundType === "image" || backgroundType === "gif";

  const handleImagePick = async (file: File | null) => {
    setUploadError(null);
    if (!file) {
      setBackgroundImageName(null);
      return;
    }
    setBackgroundImageName(file.name);
    setUploading(true);
    try {
      const { url } = await uploadSpaceBackground(file);
      setBackgroundImageUrl(url);
      setBackgroundType("image");
      toast.success("Background uploaded");
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response
        ?.status;
      const msg =
        status === 401
          ? "Log in to upload a background image"
          : (e as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Upload failed — try again";
      setUploadError(String(msg));
      setBackgroundImageUrl(null);
      toast.error(String(msg));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section>
      <SectionTitle icon={ImageIcon}>Background</SectionTitle>
      <SelectField
        aria-label="Background type"
        value={backgroundType}
        onChange={(value) => setBackgroundType(value as BackgroundType)}
      >
        <option value="solid">Solid Colour</option>
        <option value="gif">Giphy GIF</option>
        <option value="image">Upload Image / GIF</option>
      </SelectField>

      {backgroundType === "solid" && (
        <ConfigCard title="Solid Colour" icon={Sparkles}>
          <FieldRow label="Colour">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="h-8 w-14 cursor-pointer rounded border border-white/20 bg-[#151b2b] p-0.5"
              aria-label="Background colour"
            />
          </FieldRow>
        </ConfigCard>
      )}

      {backgroundType === "gif" && (
        <ConfigCard title="Giphy GIF" icon={ImageIcon}>
          {backgroundGifPreviewUrl && (
            <div className="mb-3 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backgroundGifPreviewUrl}
                alt="Selected GIF"
                className="h-24 w-full object-cover"
              />
            </div>
          )}
          <GiphyGifPicker
            selectedId={backgroundGifId}
            onSelect={(gif) => setBackgroundGif(gif)}
          />
        </ConfigCard>
      )}

      {backgroundType === "image" && (
        <ConfigCard title="Upload Image / GIF" icon={ImageIcon}>
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                void handleImagePick(e.target.files?.[0] ?? null);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-[15px] font-medium text-white hover:bg-white/10 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Choose image or GIF…"}
            </button>
            {backgroundImageUrl ? (
              <div className="overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={backgroundImageUrl}
                  alt={backgroundImageName || "Background"}
                  className="h-28 w-full object-cover"
                />
              </div>
            ) : null}
            {backgroundImageName ? (
              <p className="truncate text-sm text-white/50">
                {backgroundImageUrl ? "Uploaded: " : "Selected: "}
                {backgroundImageName}
              </p>
            ) : (
              <p className="text-sm text-white/40">No image selected</p>
            )}
            {uploadError && (
              <p className="text-sm text-red-400">{uploadError}</p>
            )}
            <FieldRow label="Fallback colour">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-8 w-14 cursor-pointer rounded border border-white/20 bg-[#151b2b] p-0.5"
                aria-label="Fallback background colour"
              />
            </FieldRow>
          </div>
        </ConfigCard>
      )}

      {showFit && (
        <ConfigCard title="Fill" icon={ImageIcon}>
          <FieldRow label="Mode">
            <select
              aria-label="Background fill mode"
              value={backgroundFit}
              onChange={(e) =>
                setBackgroundFit(e.target.value as BackgroundFit)
              }
              className="max-w-[9.5rem] cursor-pointer rounded-md border border-white/15 bg-[#151b2b] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-400/60"
            >
              {BACKGROUND_FITS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FieldRow>
          <p className="mt-2 text-xs text-white/40">
            Fill crops to cover · Fit shows full image · Stretch warps to
            screen · Tile repeats
          </p>
        </ConfigCard>
      )}
    </section>
  );
}

function TimerPanel() {
  const timerFont = useSpaceStore((s) => s.timerFont);
  const timerFontSize = useSpaceStore((s) => s.timerFontSize);
  const timerColor = useSpaceStore((s) => s.timerColor);
  const timerAnchor = useSpaceStore((s) => s.timerAnchor);
  const timerOffsetX = useSpaceStore((s) => s.timerOffsetX);
  const timerOffsetY = useSpaceStore((s) => s.timerOffsetY);
  const timerScale = useSpaceStore((s) => s.timerScale);
  const setTimerFont = useSpaceStore((s) => s.setTimerFont);
  const setTimerFontSize = useSpaceStore((s) => s.setTimerFontSize);
  const setTimerColor = useSpaceStore((s) => s.setTimerColor);
  const setTimerAnchor = useSpaceStore((s) => s.setTimerAnchor);
  const setTimerOffsetX = useSpaceStore((s) => s.setTimerOffsetX);
  const setTimerOffsetY = useSpaceStore((s) => s.setTimerOffsetY);
  const setTimerScale = useSpaceStore((s) => s.setTimerScale);
  const { data: customFonts = [] } = useFontLibrary(true) as {
    data?: Array<{
      id: string;
      name: string;
      family_name: string;
      token: string;
      url: string;
    }>;
  };

  const fontOptions = [
    ...TIMER_FONTS.map((font) => ({ value: font.value, label: font.label })),
    ...customFonts.map((font) => ({
      value: font.token || `font:${font.id}`,
      label: font.name,
    })),
  ];

  // Keep current custom selection visible even if temporarily missing from list.
  if (
    timerFont.startsWith("font:") &&
    !fontOptions.some((o) => o.value === timerFont)
  ) {
    fontOptions.push({ value: timerFont, label: "Custom font" });
  }

  return (
    <section>
      <SectionTitle icon={Timer}>Timer</SectionTitle>
      {customFonts.map((font) =>
        font.url && font.family_name ? (
          <style key={font.id}>{`
            @font-face {
              font-family: "${font.family_name}";
              src: url("${font.url}") format("truetype");
              font-display: swap;
            }
          `}</style>
        ) : null,
      )}
      <ConfigCard title="Countdown" icon={Type}>
        <div className="flex flex-col gap-3.5">
          <FieldRow label="Font">
            <select
              aria-label="Timer font"
              value={timerFont}
              onChange={(e) => {
                const next = e.target.value as TimerFontValue;
                setTimerFont(next);
                const match = customFonts.find(
                  (f) => (f.token || `font:${f.id}`) === next,
                );
                if (match) {
                  ensureSpaceFontFace({
                    id: match.id,
                    family: match.family_name,
                    url: match.url,
                  });
                }
              }}
              className="max-w-[9.5rem] cursor-pointer rounded-md border border-white/15 bg-[#151b2b] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-400/60"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Font size">
            <input
              type="number"
              min={32}
              max={160}
              value={timerFontSize}
              onChange={(e) => setTimerFontSize(Number(e.target.value))}
              className="w-20 rounded-md border border-white/15 bg-[#151b2b] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-400/60"
              aria-label="Timer font size"
            />
          </FieldRow>
          <FieldRow label="Colour">
            <input
              type="color"
              value={timerColor}
              onChange={(e) => setTimerColor(e.target.value)}
              className="h-8 w-14 cursor-pointer rounded border border-white/20 bg-[#151b2b] p-0.5"
              aria-label="Timer colour"
            />
          </FieldRow>
        </div>
      </ConfigCard>

      <ConfigCard title="Size">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>Smaller</span>
            <span className="font-medium text-white">
              {Math.round(timerScale * 100)}%
            </span>
            <span>Larger</span>
          </div>
          <input
            type="range"
            min={50}
            max={150}
            step={5}
            value={Math.round(timerScale * 100)}
            onChange={(e) => setTimerScale(Number(e.target.value) / 100)}
            className="w-full accent-blue-500"
            aria-label="Timer box size"
          />
        </div>
      </ConfigCard>

      <ConfigCard title="Position">
        <div className="flex flex-col gap-4">
          <PositionMonitor value={timerAnchor} onChange={setTimerAnchor} />
          <div className="flex flex-col gap-3.5 border-t border-white/10 pt-3.5">
            <FieldRow label="X">
              <input
                type="number"
                min={-800}
                max={800}
                step={10}
                value={timerOffsetX}
                onChange={(e) => setTimerOffsetX(Number(e.target.value))}
                className="w-20 rounded-md border border-white/15 bg-[#151b2b] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-400/60"
                aria-label="Timer horizontal offset"
              />
            </FieldRow>
            <FieldRow label="Y">
              <input
                type="number"
                min={-600}
                max={600}
                step={10}
                value={timerOffsetY}
                onChange={(e) => setTimerOffsetY(Number(e.target.value))}
                className="w-20 rounded-md border border-white/15 bg-[#151b2b] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-400/60"
                aria-label="Timer vertical offset"
              />
            </FieldRow>
            {(timerOffsetX !== 0 ||
              timerOffsetY !== 0 ||
              timerAnchor !== "center" ||
              timerScale !== 1) && (
              <button
                type="button"
                onClick={() => {
                  setTimerAnchor("center");
                  setTimerOffsetX(0);
                  setTimerOffsetY(0);
                  setTimerScale(1);
                }}
                className="self-start text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Reset layout
              </button>
            )}
          </div>
        </div>
      </ConfigCard>
    </section>
  );
}

type SoundLibraryItem = {
  id: string;
  name: string;
  url?: string | null;
  source?: string;
  youtube_url?: string | null;
  youtube_video_id?: string | null;
};

type SoundSelection =
  | {
      kind: "library";
      id: string;
      url?: string | null;
      name: string;
      source?: string;
      videoId?: string;
      youtubeUrl?: string | null;
    }
  | { kind: "youtube"; videoId: string; title?: string; url?: string }
  | { kind: "default" }
  | null;

function SoundsPanel() {
  const { prefs, loaded, updateBackground, updateRing } =
    useSoundPreferences() as {
      prefs: {
        background: {
          enabled: boolean;
          volume: number;
          selection: SoundSelection;
        };
        ring: {
          volume: number;
          selection: SoundSelection;
        };
      };
      loaded: boolean;
      updateBackground: (patch: Record<string, unknown>) => void;
      updateRing: (patch: Record<string, unknown>) => void;
    };
  const ringSoundId = useSpaceStore((s) => s.ringSoundId);
  const focusSoundId = useSpaceStore((s) => s.focusSoundId);
  const spaceSlug = useSpaceStore((s) => s.spaceSlug);
  const setRingSoundId = useSpaceStore((s) => s.setRingSoundId);
  const setFocusSoundId = useSpaceStore((s) => s.setFocusSoundId);
  const { data: backgroundSounds = [], isLoading: loadingBackground } =
    useSoundLibrary("background", loaded) as {
      data?: SoundLibraryItem[];
      isLoading: boolean;
    };
  const { data: ringSounds = [], isLoading: loadingRing } = useSoundLibrary(
    "ring",
    loaded,
  ) as {
    data?: SoundLibraryItem[];
    isLoading: boolean;
  };

  if (!loaded) return null;

  const bgSelection = prefs.background.selection;
  const ringSelection = prefs.ring.selection;
  // When a space is active, Defaults reflect the space snapshot — not personal prefs.
  // Falling back to live prefs here made creators think a sound was "on the space"
  // when it was only in their local settings, so visitors got the wrong alarm/focus.
  const spaceActive = Boolean(spaceSlug);

  const backgroundValue = focusSoundId
    ? `library:${focusSoundId}`
    : spaceActive
      ? "none"
      : bgSelection?.kind === "library"
        ? `library:${bgSelection.id}`
        : bgSelection?.kind === "youtube"
          ? `youtube:${bgSelection.videoId}`
          : "none";

  const ringValue = ringSoundId
    ? `library:${ringSoundId}`
    : spaceActive
      ? "default"
      : ringSelection?.kind === "library"
        ? `library:${ringSelection.id}`
        : "default";

  const ringOptions = [
    { value: "default", label: "Default alarm" },
    ...ringSounds.map((sound) => ({
      value: `library:${sound.id}`,
      label: sound.name,
    })),
  ];
  if (
    ringValue.startsWith("library:") &&
    !ringOptions.some((option) => option.value === ringValue)
  ) {
    ringOptions.push({
      value: ringValue,
      label:
        ringSelection?.kind === "library" &&
        ringSelection.id === ringValue.slice("library:".length)
          ? ringSelection.name
          : "Space alarm",
    });
  }

  const focusOptions = [
    { value: "none", label: "None" },
    ...(bgSelection?.kind === "youtube"
      ? [
          {
            value: `youtube:${bgSelection.videoId}`,
            label: bgSelection.title || "YouTube audio",
          },
        ]
      : []),
    ...backgroundSounds.map((sound) => ({
      value: `library:${sound.id}`,
      label: sound.name,
    })),
  ];
  if (
    backgroundValue.startsWith("library:") &&
    !focusOptions.some((option) => option.value === backgroundValue)
  ) {
    focusOptions.push({
      value: backgroundValue,
      label:
        bgSelection?.kind === "library" &&
        bgSelection.id === backgroundValue.slice("library:".length)
          ? bgSelection.name
          : "Space focus",
    });
  }

  const handleRingSelect = (nextValue: string) => {
    if (nextValue === "default") {
      updateRing({ selection: null });
      setRingSoundId(null);
      return;
    }
    if (nextValue.startsWith("library:")) {
      const id = nextValue.slice("library:".length);
      const sound = ringSounds.find((item) => item.id === id);
      if (!sound) return;
      const selection = selectionFromLibrarySound(sound);
      updateRing({ selection });
      setRingSoundId(id);
      void prefetchAudioSelection(selection);
    }
  };

  const handleFocusSelect = (nextValue: string) => {
    if (nextValue === "none") {
      updateBackground({ enabled: false, selection: null });
      setFocusSoundId(null);
      return;
    }
    if (nextValue.startsWith("youtube:")) {
      // Keep current YouTube selection; full YouTube picker lives in Settings.
      if (bgSelection?.kind === "youtube") {
        updateBackground({ enabled: true, selection: bgSelection });
      }
      setFocusSoundId(null);
      return;
    }
    if (nextValue.startsWith("library:")) {
      const id = nextValue.slice("library:".length);
      const sound = backgroundSounds.find((item) => item.id === id);
      if (!sound) return;
      const selection = selectionFromLibrarySound(sound);
      updateBackground({ enabled: true, selection });
      setFocusSoundId(id);
      void prefetchAudioSelection(selection);
    }
  };

  return (
    <section>
      <SectionTitle icon={Volume2}>Sounds</SectionTitle>
      <ConfigCard title="Defaults">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[15px] text-white/80">Default sound</span>
            <select
              aria-label="Default alarm sound"
              value={ringValue}
              disabled={loadingRing}
              onChange={(e) => handleRingSelect(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-white/15 bg-[#151b2b] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            >
              {ringOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[15px] text-white/80">Default focus sound</span>
            <select
              aria-label="Default focus sound"
              value={backgroundValue}
              disabled={loadingBackground}
              onChange={(e) => handleFocusSelect(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-white/15 bg-[#151b2b] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-50"
            >
              {focusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ConfigCard>
    </section>
  );
}

function SpaceToolbar({ tagsInput, setTagsInput }: { tagsInput: string; setTagsInput: (v: string) => void }) {
  const router = useRouter();
  const { user } = useUser() as {
    user: { id?: string; role?: string; username?: string } | null;
  };
  const appearance = useSpaceStore();
  const setSpaceMeta = useSpaceStore((s) => s.setSpaceMeta);
  const resetAppearance = useSpaceStore((s) => s.resetAppearance);
  const applyAppearance = useSpaceStore((s) => s.applyAppearance);
  const setSidebarOpen = useSpaceStore((s) => s.setSidebarOpen);
  const { prefs, updateBackground, updateRing } = useSoundPreferences() as {
    prefs: {
      background: {
        enabled: boolean;
        selection: SoundSelection;
      };
      ring: {
        selection: SoundSelection;
      };
    };
    updateBackground: (patch: Record<string, unknown>) => void;
    updateRing: (patch: Record<string, unknown>) => void;
  };
  const setRingSoundId = useSpaceStore((s) => s.setRingSoundId);
  const setFocusSoundId = useSpaceStore((s) => s.setFocusSoundId);
  const [busy, setBusy] = useState<
    "save" | "publish" | "fork" | "star" | "delete" | null
  >(null);
  const [copied, setCopied] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [mine, setMine] = useState<{
    items: Array<{
      id: string;
      title: string;
      slug: string;
      visibility?: string;
      cover_image_url?: string | null;
      layout?: Record<string, unknown>;
      baked?: {
        v: 1;
        baked_at: string;
        layout: Record<string, unknown>;
        font: { token: string; family: string | null; url: string | null };
        ring: { id: string; streamPath: string; name: string } | null;
        focus: { id: string; streamPath: string; name: string } | null;
      } | null;
      tags?: string[];
      path?: string;
      star_count?: number;
      fork_count?: number;
      starred_by_me?: boolean;
      can_edit?: boolean;
      creator?: { username?: string | null } | null;
    }>;
    count: number;
    limit: number | null;
    can_create: boolean;
  }>({ items: [], count: 0, limit: SPACE_LIMIT, can_create: true });
  const [mineLoading, setMineLoading] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = user?.role === "admin";
  const canCreateMore = isAdmin || mine.can_create;

  const refreshMine = async () => {
    if (!user) {
      setMine({ items: [], count: 0, limit: SPACE_LIMIT, can_create: false });
      return;
    }
    setMineLoading(true);
    try {
      const data = await listMySpaces();
      setMine({
        items: data.items || [],
        count: data.count ?? (data.items || []).length,
        limit: data.limit ?? SPACE_LIMIT,
        can_create: Boolean(data.can_create),
      });
    } catch {
      // ignore — list is best-effort
    } finally {
      setMineLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current != null) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    void refreshMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when auth user changes
  }, [user?.id]);

  const canEdit = appearance.spaceCanEdit;
  const isSaved = Boolean(appearance.spaceId) && canEdit;
  const path =
    appearance.spacePath ||
    (appearance.spaceOwnerUsername && appearance.spaceSlug
      ? `/${appearance.spaceOwnerUsername}/${appearance.spaceSlug}`
      : appearance.spaceSlug
        ? `/spaces/${appearance.spaceSlug}`
        : null);
  const shareUrl =
    typeof window !== "undefined" && path
      ? `${window.location.origin}${path}`
      : null;

  const syncMetaFromSpace = (space: {
    id: string;
    slug: string;
    path?: string;
    visibility: "private" | "friends" | "public";
    star_count?: number;
    fork_count?: number;
    starred_by_me?: boolean;
    can_edit?: boolean;
    tags?: string[];
    creator?: { username?: string | null } | null;
  }) => {
    setSpaceMeta({
      spaceId: space.id,
      spaceSlug: space.slug,
      spacePath: spacePath(space),
      spaceVisibility: space.visibility,
      spaceStarCount: space.star_count ?? 0,
      spaceForkCount: space.fork_count ?? 0,
      spaceStarredByMe: Boolean(space.starred_by_me),
      spaceCanEdit: Boolean(space.can_edit),
      spaceOwnerUsername: space.creator?.username ?? null,
      spaceTags: Array.isArray(space.tags) ? space.tags : [],
    });
  };

  const loadOwnedSpace = (space: (typeof mine.items)[number]) => {
    if (space.baked?.layout) {
      const font = applyBakedSpace(space.baked, {
        applyAppearance,
        updateBackground,
        updateRing,
        title: space.title,
      });
      ensureSpaceFontFace(font);
    } else {
      applyAppearance(layoutToAppearancePatch(space.layout, space.title));
      applyLayoutSounds(space.layout, { updateBackground, updateRing });
    }
    syncMetaFromSpace({
      ...space,
      visibility: (space.visibility as "private" | "friends" | "public") || "public",
      can_edit: true,
    });
    setTagsInput((space.tags || []).join(", "));
    toast.success(`Editing “${space.title}”`);
  };

  const removeOwnedSpace = async (space: (typeof mine.items)[number]) => {
    if (!confirm(`Delete “${space.title}”? This cannot be undone.`)) return;
    setBusy("delete");
    try {
      await deleteSpace(space.id);
      if (appearance.spaceId === space.id) {
        resetAppearance();
        setTagsInput("");
      }
      invalidateProfileCache(user?.username);
      await refreshMine();
      toast.success("Space deleted");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not delete space";
      toast.error(String(msg));
    } finally {
      setBusy(null);
    }
  };

  const save = async (andPublish: boolean) => {
    if (!canEdit) {
      toast.info("Fork this space to edit and save your own copy");
      return;
    }
    if (!user) {
      toast.info("Log in to save your space");
      return;
    }
    if (!appearance.spaceId && !canCreateMore) {
      toast.error(
        `You can have at most ${SPACE_LIMIT} spaces. Delete one to create another.`,
      );
      return;
    }
    const title = appearance.spaceName.trim() || "Untitled space";
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
    // Persist the Defaults dropdowns exactly — do not silently inherit personal
    // Sound Settings when store IDs are null (that made visitors hear the wrong thing).
    const soundIds = {
      ringSoundId: appearance.ringSoundId ?? null,
      focusSoundId: appearance.focusSoundId ?? null,
    };
    setRingSoundId(soundIds.ringSoundId);
    setFocusSoundId(soundIds.focusSoundId);
    const layout = appearanceToLayout(
      { ...appearance, ...soundIds },
      null,
    );
    // visibility is only allowed on create — updates use the Publish endpoint
    const payload = appearance.spaceId
      ? {
          title,
          description: null as string | null,
          tags,
          layout,
        }
      : {
          title,
          description: null as string | null,
          tags,
          visibility: appearance.spaceVisibility || "public",
          layout,
        };

    setBusy(andPublish ? "publish" : "save");
    try {
      let space = appearance.spaceId
        ? await updateSpace(appearance.spaceId, payload)
        : await createSpace(payload);

      if (andPublish) {
        space = await publishSpace(
          space.id,
          appearance.spaceVisibility || "public",
        );
      }

      if (space.layout) {
        applyAppearance(layoutToAppearancePatch(space.layout, space.title));
      }
      syncMetaFromSpace({ ...space, can_edit: true });
      setTagsInput((space.tags || tags).join(", "));
      invalidateProfileCache(user?.username);
      await refreshMine();
      toast.success(
        andPublish
          ? `Published — ${spacePath(space)}`
          : isSaved
            ? "Space updated"
            : "Space created",
      );
    } catch (e: unknown) {
      const raw =
        (e as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message || "Could not save space";
      toast.error(Array.isArray(raw) ? raw.join(", ") : String(raw));
    } finally {
      setBusy(null);
    }
  };

  const setVisibility = async (
    visibility: "private" | "friends" | "public",
  ) => {
    if (!canEdit || !appearance.spaceId) {
      setSpaceMeta({ spaceVisibility: visibility });
      return;
    }
    try {
      const space = await publishSpace(appearance.spaceId, visibility);
      syncMetaFromSpace({ ...space, can_edit: true });
      toast.success(`Privacy: ${visibility}`);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not update privacy";
      toast.error(String(msg));
    }
  };

  const createNew = () => {
    if (!canCreateMore && user) {
      toast.error(
        `You can have at most ${SPACE_LIMIT} spaces. Delete one first.`,
      );
      return;
    }
    resetAppearance();
    setTagsInput("");
    // Seed space defaults from whatever is currently selected in prefs.
    const seeded = resolveSpaceSoundIds({}, prefs);
    setRingSoundId(seeded.ringSoundId);
    setFocusSoundId(seeded.focusSoundId);
    toast.info("New space — customize, then Save this");
  };

  const fork = async () => {
    if (!appearance.spaceSlug) {
      toast.info("No space to fork");
      return;
    }
    if (!user) {
      toast.info("Log in to fork this space");
      router.push("/login");
      return;
    }
    if (!canCreateMore) {
      toast.error(
        `You can have at most ${SPACE_LIMIT} spaces. Delete one to fork.`,
      );
      return;
    }
    setBusy("fork");
    try {
      const copy = await remixSpace(appearance.spaceSlug);
      if (copy.baked?.layout) {
        const font = applyBakedSpace(copy.baked, {
          applyAppearance,
          updateBackground,
          updateRing,
          title: copy.title,
        });
        ensureSpaceFontFace(font);
      } else {
        applyAppearance(layoutToAppearancePatch(copy.layout, copy.title));
        applyLayoutSounds(copy.layout, { updateBackground, updateRing });
      }
      syncMetaFromSpace({ ...copy, can_edit: true });
      setTagsInput((copy.tags || []).join(", "));
      setSidebarOpen(true);
      invalidateProfileCache(user?.username);
      await refreshMine();
      toast.success("Forked — you can edit your copy now");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not fork";
      toast.error(String(msg));
    } finally {
      setBusy(null);
    }
  };

  const toggleStar = async () => {
    if (!appearance.spaceSlug) return;
    if (!user) {
      toast.info("Log in to star this space");
      router.push("/login");
      return;
    }
    setBusy("star");
    try {
      const next = appearance.spaceStarredByMe
        ? await unstarSpace(appearance.spaceSlug)
        : await starSpace(appearance.spaceSlug);
      setSpaceMeta({
        spaceStarCount: next.star_count ?? 0,
        spaceForkCount: next.fork_count ?? 0,
        spaceStarredByMe: Boolean(next.starred_by_me),
      });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not update star";
      toast.error(String(msg));
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) {
      toast.info("Save first to get a link");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      if (copiedTimerRef.current != null) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => {
        copiedTimerRef.current = null;
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const parseTags = (raw: string) =>
    raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);

  const tags = parseTags(tagsInput);

  const commitTag = (raw: string) => {
    const parts = raw
      .split(/[,\s]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...tags];
    for (const part of parts) {
      if (next.length >= 12) break;
      if (!next.includes(part)) next.push(part);
    }
    setTagsInput(next.join(", "));
    setSpaceMeta({ spaceTags: next });
    setTagDraft("");
  };

  const removeTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTagsInput(next.join(", "));
    setSpaceMeta({ spaceTags: next });
  };

  const privacyOptions = [
    {
      value: "public" as const,
      label: "Public",
      hint: "Anyone",
      icon: Globe2,
    },
    {
      value: "friends" as const,
      label: "Friends",
      hint: "Friends only",
      icon: Users,
    },
    {
      value: "private" as const,
      label: "Only me",
      hint: "Private",
      icon: Lock,
    },
  ];

  const visibility = appearance.spaceVisibility || "public";

  return (
    <div className="space-y-6 border-b border-white/10 bg-[#0c1220] px-6 py-6 pr-7">
      {appearance.spaceSlug && (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={busy === "star"}
            onClick={() => void toggleStar()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-2.5 text-sm font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
            title={appearance.spaceStarredByMe ? "Unstar" : "Star"}
          >
            <Star
              size={15}
              className={
                appearance.spaceStarredByMe ? "fill-amber-300 text-amber-300" : ""
              }
            />
            {appearance.spaceStarCount}
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white/70">
            <GitFork size={15} />
            {appearance.spaceForkCount}
          </span>
        </div>
      )}

      {!canEdit && (
        <div className="space-y-3">
          <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100/90">
            This is someone else&apos;s space. You can run it on your timer, but
            editing is locked until you fork your own copy.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={busy !== null || !appearance.spaceSlug || !canCreateMore}
              onClick={() => void fork()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"
              title={
                !canCreateMore
                  ? `Limit of ${SPACE_LIMIT} spaces reached`
                  : undefined
              }
            >
              <GitFork size={15} />
              {busy === "fork" ? "Forking…" : "Fork to edit"}
            </button>
            <button
              type="button"
              onClick={createNew}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              <Plus size={15} />
              Start blank
            </button>
          </div>
        </div>
      )}

      {canEdit && (
        <>
          <div className="flex flex-wrap gap-2.5 ">
            <button
              type="button"
              onClick={createNew}
              disabled={!canCreateMore && Boolean(user)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              title={
                !canCreateMore && user
                  ? `Limit of ${SPACE_LIMIT} spaces reached`
                  : undefined
              }
            >
              <Plus size={15} />
              Create new
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void save(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-400/40 bg-blue-500/15 px-3.5 py-2.5 text-sm font-medium text-blue-200 hover:bg-blue-500/25 disabled:opacity-50"
            >
              <Save size={15} />
              {busy === "save"
                ? "Saving…"
                : isSaved
                  ? "Save changes"
                  : "Save this"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void save(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {busy === "publish" ? "Publishing…" : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => void copyLink()}
              disabled={!shareUrl}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              title={shareUrl ? shareUrl : "Save first to copy a link"}
            >
              {copied ? (
                <Check size={15} className="text-emerald-400" />
              ) : (
                <Copy size={15} />
              )}
              {copied ? "Copied" : "Copy link"}
            </button>
            {isSaved && (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => {
                  const current = mine.items.find(
                    (s) => s.id === appearance.spaceId,
                  );
                  if (current) void removeOwnedSpace(current);
                  else if (appearance.spaceId) {
                    void removeOwnedSpace({
                      id: appearance.spaceId,
                      title: appearance.spaceName || "this space",
                      slug: appearance.spaceSlug || "",
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50"
              >
                <Trash2 size={15} />
                {busy === "delete" ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>

          <div className="pt-1">
            <LabelWithIcon icon={Shield}>Privacy</LabelWithIcon>
            <div className="grid grid-cols-3 gap-2">
              {privacyOptions.map((opt) => {
                const selected = visibility === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => void setVisibility(opt.value)}
                    className={`flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-1.5 py-2.5 text-center transition ${
                      selected
                        ? "border-blue-400/50 bg-blue-500/20 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,0.15)]"
                        : "border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.07]"
                    }`}
                  >
                    <Icon size={16} className={selected ? "text-blue-300" : ""} />
                    <span className="text-[11px] font-semibold leading-tight">
                      {opt.label}
                    </span>
                    <span className="text-[9px] leading-tight text-white/40">
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <LabelWithIcon icon={Tag}>Tags</LabelWithIcon>
            <div className="min-h-[3rem] rounded-2xl border border-white/15 bg-[#151b2b] px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/25 px-2.5 py-1.5 text-xs font-medium text-blue-50 hover:bg-blue-500/40"
                    title={`Remove ${tag}`}
                  >
                    {tag}
                    <X size={12} className="opacity-80" />
                  </button>
                ))}
                <input
                  type="text"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      commitTag(tagDraft);
                    } else if (
                      e.key === "Backspace" &&
                      !tagDraft &&
                      tags.length > 0
                    ) {
                      removeTag(tags[tags.length - 1]);
                    }
                  }}
                  onBlur={() => commitTag(tagDraft)}
                  placeholder={tags.length ? "Add tag…" : "Type a tag, press Enter"}
                  className="min-w-[8rem] flex-1 bg-transparent px-1 py-1.5 text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>
            </div>
            <p className="mt-2.5 text-[11px] leading-relaxed text-white/40">
              Press Enter to add · click a tag to remove
            </p>
          </div>
        </>
      )}

      {user && (
        <div className="space-y-2.5">
          {!isAdmin && (
            <p className="text-[11px] text-white/40">
              {mine.count}/{mine.limit ?? SPACE_LIMIT} spaces used
              {!canCreateMore
                ? " — delete one to create or fork another"
                : ""}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <LabelWithIcon icon={FolderOpen}>My spaces</LabelWithIcon>
            {mineLoading && (
              <span className="text-[11px] text-white/35">Loading…</span>
            )}
          </div>
          {mine.items.length === 0 && !mineLoading ? (
            <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-3 text-xs text-white/45">
              No saved spaces yet. Customize and hit Save this.
            </p>
          ) : (
            <ul className="max-h-48 space-y-1.5 overflow-y-auto overscroll-contain">
              {mine.items.map((space) => {
                const active = appearance.spaceId === space.id;
                return (
                  <li
                    key={space.id}
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                      active
                        ? "border-blue-400/40 bg-blue-500/15"
                        : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => loadOwnedSpace(space)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-medium text-white">
                        {space.title || "Untitled"}
                      </p>
                      <p className="truncate text-[10px] capitalize text-white/40">
                        {space.visibility || "public"}
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void removeOwnedSpace(space)}
                      className="shrink-0 rounded-lg p-1.5 text-white/40 hover:bg-red-500/20 hover:text-red-200 disabled:opacity-50"
                      aria-label={`Delete ${space.title}`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 text-xs text-white/45">
        <span>
          {appearance.spaceVisibility
            ? `Privacy: ${appearance.spaceVisibility}`
            : canEdit
              ? "Not saved yet"
              : "Read-only session"}
        </span>
        {path && (
          <Link
            href={path}
            className="inline-flex max-w-full items-center gap-1 truncate text-blue-400 hover:text-blue-300"
          >
            <Link2 size={12} className="shrink-0" />
            <span className="truncate">{path}</span>
          </Link>
        )}
        <Link href="/spaces" className="text-white/50 hover:text-white">
          Browse all →
        </Link>
      </div>
    </div>
  );
}

export function SpaceSettingsSidebar() {
  const open = useSpaceStore((s) => s.sidebarOpen);
  const setSidebarOpen = useSpaceStore((s) => s.setSidebarOpen);
  const spaceName = useSpaceStore((s) => s.spaceName);
  const setSpaceName = useSpaceStore((s) => s.setSpaceName);
  const resetAppearance = useSpaceStore((s) => s.resetAppearance);
  const canEdit = useSpaceStore((s) => s.spaceCanEdit);
  const spaceTags = useSpaceStore((s) => s.spaceTags);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (!open) return;
    setTagsInput((spaceTags || []).join(", "));
  }, [open, spaceTags]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close space settings"
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[28rem] flex-col overflow-hidden border-l border-white/10 bg-[#0b1220] text-white shadow-2xl shadow-black/50 sm:max-w-[32rem]"
        role="dialog"
        aria-label="Space settings"
      >
        {/* Compact sticky bar — only close/reset stay pinned */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-[#0d1528] to-[#111a30] px-5 pr-6 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
              <Paintbrush size={15} />
            </span>
            <p className="truncate text-sm font-medium text-white/80">
              {canEdit ? "Customize space" : "Read-only — fork to edit"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {canEdit && (
              <button
                type="button"
                onClick={resetAppearance}
                className="inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Reset all space settings"
                title="Reset appearance"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Everything else scrolls together — gutter keeps content off the scrollbar */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
          <div className="border-b border-white/10 px-6 py-5 pr-7">
            <label
              htmlFor="space-name"
              className="mb-2.5 flex items-center gap-2.5 text-sm font-medium text-blue-200/90"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                <Type size={15} />
              </span>
              Space name
            </label>
            <input
              id="space-name"
              type="text"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="My focus space"
              maxLength={48}
              disabled={!canEdit}
              className="box-border w-full max-w-full rounded-2xl border border-white/15 bg-[#151b2b] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/35 focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/30 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <SpaceToolbar tagsInput={tagsInput} setTagsInput={setTagsInput} />

          <div
            className={`space-y-10 px-6 pb-14 pr-7 pt-6 ${
              canEdit ? "" : "pointer-events-none opacity-50"
            }`}
            aria-disabled={!canEdit}
          >
            <BackgroundPanel />
            <TimerPanel />
            <SoundsPanel />
          </div>
        </div>
      </aside>
    </>
  );
}
