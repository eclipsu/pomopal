import { getLastFocusDateLocal, localTodayYmd } from "./focusDateStorage";

/** Must match backend STREAK_GRACE_DAYS. */
export const STREAK_GRACE_DAYS = 2;

/**
 * @typedef {'active' | 'at_risk' | 'inactive'} StreakVisualStatus
 */

function daysBetweenYmd(from, to) {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}

/**
 * @param {{ current_streak?: number; last_active_date?: string | null; grace_days_remaining?: number }} streak
 * @returns {StreakVisualStatus}
 */
export function deriveStreakStatus(streak) {
  const count = streak?.current_streak ?? 0;
  if (count <= 0) return "inactive";

  const today = localTodayYmd();
  const lastActive = streak?.last_active_date?.slice?.(0, 10) ?? null;
  const lastFocusLocal = getLastFocusDateLocal();

  if (lastActive === today || lastFocusLocal === today) return "active";

  if (lastActive) {
    const gap = daysBetweenYmd(lastActive, today);
    if (gap >= 1 && gap <= STREAK_GRACE_DAYS) return "at_risk";
    if (gap > STREAK_GRACE_DAYS) return "inactive";
  }

  if (typeof streak?.grace_days_remaining === "number") {
    if (streak.grace_days_remaining >= STREAK_GRACE_DAYS) return "active";
    if (streak.grace_days_remaining >= 0 && count > 0) return "at_risk";
  }

  if (lastFocusLocal && lastFocusLocal !== today) {
    const gap = daysBetweenYmd(lastFocusLocal, today);
    if (gap >= 1 && gap <= STREAK_GRACE_DAYS) return "at_risk";
  }

  if (count > 0) return "at_risk";
  return "inactive";
}

export const STREAK_STATUS_LABELS = {
  active: "Streak active — you focused today",
  at_risk: `Streak at risk — ${STREAK_GRACE_DAYS}-day grace; focus soon to keep it`,
  inactive: "No active streak",
};

export function streakAtRiskMessage(streakCount, graceDaysRemaining) {
  const days =
    typeof graceDaysRemaining === "number" ? graceDaysRemaining : null;
  if (days === 0) {
    return `Your ${streakCount}-day streak ends tonight — last day of grace. One pomodoro keeps it alive.`;
  }
  if (days === 1) {
    return `Your ${streakCount}-day streak is on grace — 1 day left. One pomodoro keeps it alive.`;
  }
  return `Your ${streakCount}-day streak is on a ${STREAK_GRACE_DAYS}-day grace. One pomodoro keeps it alive.`;
}
