const PREFIX = "pomopal_week_analytics_";

function cacheKey(from, to) {
  return `${PREFIX}${from}_${to}`;
}

export function readWeekAnalyticsCache(from, to) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(from, to));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !Array.isArray(parsed.data)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

/** Past weeks are stored locally so we rarely refetch. */
export function writeWeekAnalyticsCache(from, to, data) {
  if (typeof window === "undefined" || !Array.isArray(data)) return;
  try {
    localStorage.setItem(
      cacheKey(from, to),
      JSON.stringify({ data, cachedAt: Date.now() }),
    );
  } catch {
    // quota exceeded — ignore
  }
}

export function isPastWeek(weekOffset) {
  return weekOffset !== 0;
}
