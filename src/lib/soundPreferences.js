const STORAGE_KEY = "pomopalSoundSettings";

export const DEFAULT_SOUND_PREFERENCES = {
  background: {
    enabled: false,
    volume: 50,
    selection: null,
  },
  ring: {
    volume: 80,
    selection: null,
  },
};

export function readSoundPreferences() {
  if (typeof window === "undefined") return DEFAULT_SOUND_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SOUND_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      background: {
        ...DEFAULT_SOUND_PREFERENCES.background,
        ...parsed.background,
      },
      ring: {
        ...DEFAULT_SOUND_PREFERENCES.ring,
        ...parsed.ring,
      },
    };
  } catch {
    return DEFAULT_SOUND_PREFERENCES;
  }
}

export function writeSoundPreferences(prefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // quota exceeded — ignore
  }
}
