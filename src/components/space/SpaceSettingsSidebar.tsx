"use client";

import { useRef, type ReactNode } from "react";
import { RotateCcw, X } from "lucide-react";
import {
  TIMER_ANCHORS,
  TIMER_FONTS,
  useSpaceStore,
  type BackgroundType,
  type TimerAnchor,
  type TimerFontValue,
} from "@/stores/useSpaceStore";
import { useSoundPreferences } from "@/hooks/useSoundPreferences";
import { useSoundLibrary } from "@/hooks/useSoundLibrary";
import { prefetchAudioSelection } from "@/lib/audioCache";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-[1.35rem] font-bold tracking-tight text-zinc-900">
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
      className="w-full cursor-pointer appearance-none rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-[15px] text-zinc-800 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
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
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-3 rounded-lg bg-zinc-100 px-4 py-3.5">
      <h3 className="mb-3 text-[15px] font-semibold text-zinc-900">{title}</h3>
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-[15px] text-zinc-800">{label}</span>
      {children}
    </div>
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
        className="w-full max-w-[11rem] rounded-md border-2 border-zinc-400 bg-zinc-50 p-1.5 shadow-inner"
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
                className={`aspect-square rounded-sm transition-colors ${
                  selected
                    ? "bg-sky-500 shadow-sm"
                    : "bg-zinc-200 hover:bg-zinc-300"
                }`}
              />
            );
          })}
        </div>
      </div>
      {/* Monitor stand */}
      <div className="flex flex-col items-center" aria-hidden>
        <div className="h-2 w-8 rounded-b bg-zinc-300" />
        <div className="h-1 w-14 rounded-full bg-zinc-300" />
      </div>
      <p className="text-xs text-zinc-500">
        {TIMER_ANCHORS.find((a) => a.id === value)?.label ?? "Center"}
      </p>
    </div>
  );
}

function BackgroundPanel() {
  const backgroundType = useSpaceStore((s) => s.backgroundType);
  const backgroundColor = useSpaceStore((s) => s.backgroundColor);
  const backgroundImageName = useSpaceStore((s) => s.backgroundImageName);
  const setBackgroundType = useSpaceStore((s) => s.setBackgroundType);
  const setBackgroundColor = useSpaceStore((s) => s.setBackgroundColor);
  const setBackgroundImageName = useSpaceStore((s) => s.setBackgroundImageName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section>
      <SectionTitle>Background</SectionTitle>
      <SelectField
        aria-label="Background type"
        value={backgroundType}
        onChange={(value) => setBackgroundType(value as BackgroundType)}
      >
        <option value="solid">Solid Colour</option>
        <option value="image">Upload Image</option>
      </SelectField>

      {backgroundType === "solid" && (
        <ConfigCard title="Solid Colour">
          <FieldRow label="Colour">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="h-8 w-14 cursor-pointer rounded border border-zinc-300 bg-white p-0.5"
              aria-label="Background colour"
            />
          </FieldRow>
        </ConfigCard>
      )}

      {backgroundType === "image" && (
        <ConfigCard title="Upload Image">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-600">
              Choose an image to use as your space background.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setBackgroundImageName(file ? file.name : null);
                // Upload handling comes later — UI only for now.
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-[15px] font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Choose image…
            </button>
            {backgroundImageName ? (
              <p className="truncate text-sm text-zinc-500">
                Selected: {backgroundImageName}
              </p>
            ) : (
              <p className="text-sm text-zinc-400">No image selected</p>
            )}
          </div>
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

  return (
    <section>
      <SectionTitle>Timer</SectionTitle>
      <ConfigCard title="Countdown">
        <div className="flex flex-col gap-3.5">
          <FieldRow label="Font">
            <select
              aria-label="Timer font"
              value={timerFont}
              onChange={(e) => setTimerFont(e.target.value as TimerFontValue)}
              className="max-w-[9.5rem] cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none focus:border-sky-500"
            >
              {TIMER_FONTS.map((font) => (
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
              className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none focus:border-sky-500"
              aria-label="Timer font size"
            />
          </FieldRow>
          <FieldRow label="Colour">
            <input
              type="color"
              value={timerColor}
              onChange={(e) => setTimerColor(e.target.value)}
              className="h-8 w-14 cursor-pointer rounded border border-zinc-300 bg-white p-0.5"
              aria-label="Timer colour"
            />
          </FieldRow>
        </div>
      </ConfigCard>

      <ConfigCard title="Size">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-zinc-600">
            <span>Smaller</span>
            <span className="font-medium text-zinc-800">
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
            className="w-full accent-sky-500"
            aria-label="Timer box size"
          />
        </div>
      </ConfigCard>

      <ConfigCard title="Position">
        <div className="flex flex-col gap-4">
          <PositionMonitor value={timerAnchor} onChange={setTimerAnchor} />
          <div className="flex flex-col gap-3.5 border-t border-zinc-200 pt-3.5">
            <FieldRow label="X">
              <input
                type="number"
                min={-800}
                max={800}
                step={10}
                value={timerOffsetX}
                onChange={(e) => setTimerOffsetX(Number(e.target.value))}
                className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none focus:border-sky-500"
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
                className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none focus:border-sky-500"
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
                className="self-start text-sm font-medium text-sky-600 hover:text-sky-700"
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
  url: string;
};

type SoundSelection =
  | { kind: "library"; id: string; url: string; name: string }
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

  const backgroundValue =
    bgSelection?.kind === "library"
      ? `library:${bgSelection.id}`
      : bgSelection?.kind === "youtube"
        ? `youtube:${bgSelection.videoId}`
        : "none";

  const ringValue =
    ringSelection?.kind === "library"
      ? `library:${ringSelection.id}`
      : "default";

  const ringOptions = [
    { value: "default", label: "Default alarm" },
    ...ringSounds.map((sound) => ({
      value: `library:${sound.id}`,
      label: sound.name,
    })),
  ];

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

  const handleRingSelect = (nextValue: string) => {
    if (nextValue === "default") {
      updateRing({ selection: null });
      return;
    }
    if (nextValue.startsWith("library:")) {
      const id = nextValue.slice("library:".length);
      const sound = ringSounds.find((item) => item.id === id);
      if (!sound) return;
      const selection = {
        kind: "library" as const,
        id: sound.id,
        url: sound.url,
        name: sound.name,
      };
      updateRing({ selection });
      void prefetchAudioSelection(selection);
    }
  };

  const handleFocusSelect = (nextValue: string) => {
    if (nextValue === "none") {
      updateBackground({ enabled: false, selection: null });
      return;
    }
    if (nextValue.startsWith("youtube:")) {
      // Keep current YouTube selection; full YouTube picker lives in Settings.
      if (bgSelection?.kind === "youtube") {
        updateBackground({ enabled: true, selection: bgSelection });
      }
      return;
    }
    if (nextValue.startsWith("library:")) {
      const id = nextValue.slice("library:".length);
      const sound = backgroundSounds.find((item) => item.id === id);
      if (!sound) return;
      const selection = {
        kind: "library" as const,
        id: sound.id,
        url: sound.url,
        name: sound.name,
      };
      updateBackground({ enabled: true, selection });
      void prefetchAudioSelection(selection);
    }
  };

  return (
    <section>
      <SectionTitle>Sounds</SectionTitle>
      <ConfigCard title="Defaults">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[15px] text-zinc-800">Default sound</span>
            <select
              aria-label="Default alarm sound"
              value={ringValue}
              disabled={loadingRing}
              onChange={(e) => handleRingSelect(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none focus:border-sky-500 disabled:opacity-50"
            >
              {ringOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[15px] text-zinc-800">Default focus sound</span>
            <select
              aria-label="Default focus sound"
              value={backgroundValue}
              disabled={loadingBackground}
              onChange={(e) => handleFocusSelect(e.target.value)}
              className="w-full cursor-pointer rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none focus:border-sky-500 disabled:opacity-50"
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

export function SpaceSettingsSidebar() {
  const open = useSpaceStore((s) => s.sidebarOpen);
  const setSidebarOpen = useSpaceStore((s) => s.setSidebarOpen);
  const spaceName = useSpaceStore((s) => s.spaceName);
  const setSpaceName = useSpaceStore((s) => s.setSpaceName);
  const resetAppearance = useSpaceStore((s) => s.resetAppearance);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close space settings"
        className="fixed inset-0 z-40 bg-black/20 md:bg-transparent"
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[22rem] flex-col border-l border-zinc-200 bg-white shadow-xl"
        role="dialog"
        aria-label="Space settings"
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="space-name"
              className="mb-1.5 block text-sm font-medium text-zinc-600"
            >
              What should your space be called?
            </label>
            <input
              id="space-name"
              type="text"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="My focus space"
              maxLength={48}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="mt-6 flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={resetAppearance}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="Reset all space settings"
              title="Reset all space settings"
            >
              <RotateCcw size={15} />
              Reset
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-5 pb-8 pt-4">
          <BackgroundPanel />
          <TimerPanel />
          <SoundsPanel />
        </div>
      </aside>
    </>
  );
}
