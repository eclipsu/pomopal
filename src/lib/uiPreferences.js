const STORAGE_KEY = "pomopalUiSettings";

export const DEFAULT_UI_PREFERENCES = {
  /** Fade nav, footer, and mode tabs while the timer is running */
  hideChromeWhileFocusing: false,
};

export function readUiPreferences() {
  if (typeof window === "undefined") return DEFAULT_UI_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UI_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_UI_PREFERENCES,
      ...parsed,
    };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

export function writeUiPreferences(prefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
}
