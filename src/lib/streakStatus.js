import { getLastFocusDateLocal, localTodayYmd } from "./focusDateStorage";

/**
 * @typedef {'active' | 'at_risk' | 'inactive'} StreakVisualStatus
 */

/**
 * @param {{ current_streak?: number; last_active_date?: string | null }} streak
 * @returns {StreakVisualStatus}
 */
export function deriveStreakStatus(streak) {
  const count = streak?.current_streak ?? 0;
  if (count <= 0) return "inactive";

  const today = localTodayYmd();
  const lastActive = streak?.last_active_date?.slice?.(0, 10) ?? null;
  const lastFocusLocal = getLastFocusDateLocal();

  if (lastActive === today || lastFocusLocal === today) return "active";
  if (lastActive) return "at_risk";

  if (lastFocusLocal && lastFocusLocal !== today) return "at_risk";
  if (count > 0) return "at_risk";

  return "inactive";
}

export const STREAK_STATUS_LABELS = {
  active: "Streak active — you focused today",
  at_risk: "Streak at risk — focus today to keep it",
  inactive: "No active streak",
};
