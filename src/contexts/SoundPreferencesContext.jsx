"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_SOUND_PREFERENCES,
  readSoundPreferences,
  writeSoundPreferences,
} from "@/lib/soundPreferences";
import { bgLog } from "@/lib/backgroundAudioLog";

const SoundPreferencesContext = createContext(null);

export function SoundPreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(DEFAULT_SOUND_PREFERENCES);
  const [loaded, setLoaded] = useState(false);
  const [volumePreviewActive, setVolumePreviewActiveState] = useState(false);
  const [livePlayback, setLivePlayback] = useState({
    alarmRinging: false,
    backgroundPlaying: false,
  });

  const setVolumePreviewActive = useCallback((active) => {
    bgLog("prefs:volumePreviewActive", { active });
    setVolumePreviewActiveState(active);
  }, []);

  useEffect(() => {
    setPrefs(readSoundPreferences());
    setLoaded(true);
  }, []);

  const updateBackground = useCallback((patch) => {
    bgLog("prefs:updateBackground", patch);
    setPrefs((prev) => {
      const next = {
        ...prev,
        background: { ...prev.background, ...patch },
      };
      writeSoundPreferences(next);
      return next;
    });
  }, []);

  const updateRing = useCallback((patch) => {
    setPrefs((prev) => {
      const next = {
        ...prev,
        ring: { ...prev.ring, ...patch },
      };
      writeSoundPreferences(next);
      return next;
    });
  }, []);

  const setPreferences = useCallback((next) => {
    const merged = {
      background: {
        ...DEFAULT_SOUND_PREFERENCES.background,
        ...next.background,
      },
      ring: {
        ...DEFAULT_SOUND_PREFERENCES.ring,
        ...next.ring,
      },
    };
    setPrefs(merged);
    writeSoundPreferences(merged);
  }, []);

  const value = useMemo(
    () => ({
      prefs,
      loaded,
      volumePreviewActive,
      setVolumePreviewActive,
      livePlayback,
      setLivePlayback,
      updateBackground,
      updateRing,
      setPreferences,
    }),
    [
      prefs,
      loaded,
      volumePreviewActive,
      livePlayback,
      setVolumePreviewActive,
      updateBackground,
      updateRing,
      setPreferences,
    ],
  );

  return (
    <SoundPreferencesContext.Provider value={value}>
      {children}
    </SoundPreferencesContext.Provider>
  );
}

export function useSoundPreferences() {
  const ctx = useContext(SoundPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useSoundPreferences must be used within SoundPreferencesProvider",
    );
  }
  return ctx;
}
