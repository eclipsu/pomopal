"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  AudioSource,
  listCachedTracks,
  prefetchAudioSelection,
} from "@/lib/audioCache";
import { buildYoutubeWatchUrl } from "@/lib/youtube.util";
import { bgLog } from "@/lib/backgroundAudioLog";
import { useSoundLibrary } from "@/hooks/useSoundLibrary";
import { useSoundPreferences } from "@/hooks/useSoundPreferences";
import { useVolumePreview } from "@/hooks/useVolumePreview";

function selectionCacheKey(selection) {
  if (!selection?.kind) return "";
  if (selection.kind === "youtube") {
    return `youtube:${selection.videoId || selection.url}`;
  }
  if (selection.kind === "library") {
    return `library:${selection.id}`;
  }
  return "";
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 disabled:opacity-50 ${
        checked ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function InlineVolumeSlider({
  value,
  onChange,
  onPreviewStart,
  onPreviewVolume,
  onPreviewEnd,
  disabled,
  previewDisabled = false,
}) {
  const draggingRef = useRef(false);

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (!previewDisabled) {
      onPreviewEnd?.();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-7 text-right text-sm text-gray-400">{value}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onPointerDown={(e) => {
          if (disabled) return;
          draggingRef.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          if (!previewDisabled) {
            onPreviewStart?.(value);
          }
        }}
        onChange={(e) => {
          const next = Number(e.target.value);
          onChange(next);
          if (draggingRef.current && !previewDisabled) {
            onPreviewVolume?.(next);
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture?.(e.pointerId);
          endDrag();
        }}
        onPointerCancel={endDrag}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-300 accent-gray-500 disabled:opacity-50"
      />
    </div>
  );
}

function selectionLabel(selection) {
  if (!selection) return "None";
  if (selection.kind === "youtube") {
    return selection.title || selection.videoId || "YouTube audio";
  }
  if (selection.kind === "library") {
    return selection.name || "Library sound";
  }
  if (selection.kind === "default") {
    return "Default alarm";
  }
  return "Selected";
}

function SelectField({ value, onChange, options, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-10 w-full appearance-none rounded-md border border-gray-200 bg-gray-100 px-3 pr-9 text-sm text-gray-700 outline-none transition focus:border-gray-400 disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
    </div>
  );
}


export default function SoundSettings() {
  const {
    prefs,
    loaded,
    updateBackground,
    updateRing,
    setVolumePreviewActive,
    livePlayback,
  } = useSoundPreferences();
  const { data: backgroundSounds = [], isLoading: loadingBackground } =
    useSoundLibrary("background", loaded);
  const { data: ringSounds = [], isLoading: loadingRing } =
    useSoundLibrary("ring", loaded);

  const { previewAudioRef, beginPreview, setPreviewVolume, endPreview } =
    useVolumePreview(setVolumePreviewActive);

  const [error, setError] = useState(null);
  const [cachedYoutube, setCachedYoutube] = useState([]);

  const refreshCachedYoutube = useCallback(async () => {
    const tracks = await listCachedTracks(AudioSource.YOUTUBE);
    setCachedYoutube(tracks);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    refreshCachedYoutube();
  }, [loaded, refreshCachedYoutube]);

  const bgSelectionKey = selectionCacheKey(prefs.background.selection);
  const ringSelectionKey = selectionCacheKey(prefs.ring.selection);

  useEffect(() => {
    if (!loaded || !prefs.background.selection) return;
    void prefetchAudioSelection(prefs.background.selection);
  }, [loaded, bgSelectionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loaded || !prefs.ring.selection) return;
    void prefetchAudioSelection(prefs.ring.selection);
  }, [loaded, ringSelectionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) return null;

  const selectYoutubeTrack = (track) => {
    const selection = {
      kind: "youtube",
      url: track.sourceUrl || buildYoutubeWatchUrl(track.sourceId),
      videoId: track.sourceId,
      title: track.title,
    };
    updateBackground({ enabled: true, selection });
    void prefetchAudioSelection(selection);
  };

  const selectLibraryBackground = (sound) => {
    const selection = {
      kind: "library",
      id: sound.id,
      url: sound.url,
      name: sound.name,
    };
    updateBackground({ enabled: true, selection });
    void prefetchAudioSelection(selection);
  };

  const selectLibraryRing = (sound) => {
    const selection = {
      kind: "library",
      id: sound.id,
      url: sound.url,
      name: sound.name,
    };
    updateRing({ selection });
    void prefetchAudioSelection(selection);
  };

  const bgSelection = prefs.background.selection;
  const ringSelection = prefs.ring.selection;
  const hasBackgroundChoices =
    backgroundSounds.length > 0 || cachedYoutube.length > 0;
  const previewBlocked =
    livePlayback.alarmRinging || livePlayback.backgroundPlaying;

  useEffect(() => {
    bgLog("settings:previewBlocked", {
      previewBlocked,
      alarmRinging: livePlayback.alarmRinging,
      backgroundPlaying: livePlayback.backgroundPlaying,
    });
  }, [previewBlocked, livePlayback.alarmRinging, livePlayback.backgroundPlaying]);

  const startBackgroundPreview = useCallback(
    (volume) => {
      beginPreview("background", bgSelection, volume);
    },
    [beginPreview, bgSelection],
  );

  const startRingPreview = useCallback(
    (volume) => {
      beginPreview("ring", ringSelection, volume);
    },
    [beginPreview, ringSelection],
  );

  const backgroundOptions = [
    { value: "none", label: "None" },
    ...cachedYoutube.map((track) => ({
      value: `youtube:${track.sourceId}`,
      label: track.title,
    })),
    ...backgroundSounds.map((sound) => ({
      value: `library:${sound.id}`,
      label: sound.name,
    })),
  ];

  const ringOptions = [
    { value: "default", label: "Default alarm" },
    ...ringSounds.map((sound) => ({
      value: `library:${sound.id}`,
      label: sound.name,
    })),
  ];

  const backgroundValue =
    bgSelection?.kind === "youtube"
      ? `youtube:${bgSelection.videoId}`
      : bgSelection?.kind === "library"
        ? `library:${bgSelection.id}`
        : "none";

  const ringValue =
    ringSelection?.kind === "library"
      ? `library:${ringSelection.id}`
      : "default";

  const handleBackgroundSelect = (nextValue) => {
    if (nextValue === "none") {
      updateBackground({ enabled: false, selection: null });
      return;
    }

    if (nextValue.startsWith("youtube:")) {
      const videoId = nextValue.slice("youtube:".length);
      const track = cachedYoutube.find((item) => item.sourceId === videoId);
      if (track) {
        selectYoutubeTrack(track);
      }
      return;
    }

    if (nextValue.startsWith("library:")) {
      const id = nextValue.slice("library:".length);
      const sound = backgroundSounds.find((item) => item.id === id);
      if (sound) {
        selectLibraryBackground(sound);
      }
    }
  };

  const handleRingSelect = (nextValue) => {
    if (nextValue === "default") {
      updateRing({ selection: null });
      return;
    }

    if (nextValue.startsWith("library:")) {
      const id = nextValue.slice("library:".length);
      const sound = ringSounds.find((item) => item.id === id);
      if (sound) {
        selectLibraryRing(sound);
      }
    }
  };

  return (
    <div className="mt-5">
      <audio ref={previewAudioRef} preload="auto" className="hidden" aria-hidden />
      <div className="h-px w-full bg-gray-200 mb-4" />
      <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">
        Sounds
      </h2>

      <div className="space-y-5">
        <div className="space-y-5 rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(180px,220px)] items-center gap-x-4 gap-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">Alarm sound</p>
            </div>
            <SelectField
              value={ringValue}
              onChange={handleRingSelect}
              options={ringOptions}
              disabled={loadingRing}
            />

            <div className="text-sm text-gray-700">Volume</div>
            <InlineVolumeSlider
              value={prefs.ring.volume}
              previewDisabled={previewBlocked}
              onChange={(volume) => updateRing({ volume })}
              onPreviewStart={startRingPreview}
              onPreviewVolume={setPreviewVolume}
              onPreviewEnd={endPreview}
            />

            <div />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(180px,220px)] items-center gap-x-4 gap-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-700">Focus sound</p>
              <Toggle
                checked={prefs.background.enabled}
                onChange={(enabled) => updateBackground({ enabled })}
                disabled={!bgSelection}
              />
            </div>
            <SelectField
              value={backgroundValue}
              onChange={handleBackgroundSelect}
              options={backgroundOptions}
              disabled={loadingBackground || !hasBackgroundChoices}
            />

            <div className="text-sm text-gray-700">Volume</div>
            <InlineVolumeSlider
              value={prefs.background.volume}
              disabled={!bgSelection}
              previewDisabled={previewBlocked}
              onChange={(volume) => updateBackground({ volume })}
              onPreviewStart={startBackgroundPreview}
              onPreviewVolume={setPreviewVolume}
              onPreviewEnd={endPreview}
            />
          </div>

          <div className="grid gap-1 text-xs text-gray-500">
            <p>
              Alarm:{" "}
              <span className="text-gray-700">
                {ringSelection ? selectionLabel(ringSelection) : "Default alarm"}
              </span>
            </p>
            <p>
              Focus: <span className="text-gray-700">{selectionLabel(bgSelection)}</span>
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
