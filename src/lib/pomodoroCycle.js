/**
 * Pomodoro → short break → … → long break cycle.
 * Counts completed pomodoros since the last long break; resets each day.
 */
import { localTodayYmd } from "./focusDateStorage";

const STORAGE_KEY = "pomopalCycle";
export const DEFAULT_LONG_BREAK_INTERVAL = 3;

const INTERVAL_KEY = "pomopalLongBreakInterval";

/**
 * Local copy of "long break every N", used when the backend doesn't store
 * `long_break_interval` (older API versions reject the field).
 */
export function readLongBreakInterval() {
  if (typeof window === "undefined") return null;
  try {
    const n = Number(localStorage.getItem(INTERVAL_KEY));
    return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
  } catch {
    return null;
  }
}

export function writeLongBreakInterval(n) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INTERVAL_KEY, String(n));
  } catch {
    // ignore quota errors
  }
}

export function readCycleCount() {
  if (typeof window === "undefined") return 0;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || parsed.date !== localTodayYmd()) return 0;
    return Number.isInteger(parsed.count) && parsed.count > 0 ? parsed.count : 0;
  } catch {
    return 0;
  }
}

export function writeCycleCount(count) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ count: Math.max(0, count), date: localTodayYmd() }),
    );
  } catch {
    // ignore quota errors
  }
}

/**
 * Given the mode that just finished and pomodoros done before it, returns the
 * next mode (0 pomodoro, 1 short break, 2 long break) and the new count.
 */
export function nextInCycle(finishedMode, count, interval) {
  const every = Math.max(1, interval || DEFAULT_LONG_BREAK_INTERVAL);
  if (finishedMode === 0) {
    const done = count + 1;
    return { next: done % every === 0 ? 2 : 1, count: done };
  }
  // Long break closes the set; short break keeps counting.
  return { next: 0, count: finishedMode === 2 ? 0 : count };
}
