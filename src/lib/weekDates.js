/** Local calendar dates as YYYY-MM-DD (matches backend daily_stats.date). */

export function toYmd(date) {
  return date.toLocaleDateString("en-CA");
}

export function addDaysYmd(ymd, days) {
  const [y, m, d] = ymd.split("-").map(Number);
  return toYmd(new Date(y, m - 1, d + days));
}

function resolveTimeZone(timeZone) {
  const trimmed = timeZone?.trim();
  if (trimmed) return trimmed;
  if (typeof Intl !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return "UTC";
}

function weekdayIndexInTz(date, timeZone) {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(short);
}

export function todayYmdInTz(timeZone) {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: resolveTimeZone(timeZone),
  });
}

/** Week Sun–Sat in the given IANA timezone (defaults to browser TZ). */
export function getWeekRange(weekOffset = 0, timeZone) {
  const tz = resolveTimeZone(timeZone);
  const todayYmd = todayYmdInTz(tz);
  const day = weekdayIndexInTz(new Date(), tz);
  const from = addDaysYmd(todayYmd, -day + weekOffset * 7);
  const to = addDaysYmd(from, 6);
  return { from, to };
}

/** Build [from, from+1, … to] as YYYY-MM-DD strings. */
export function datesInRange(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDaysYmd(d, 1)) {
    out.push(d);
  }
  return out;
}
