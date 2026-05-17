const KEY = "pomopal_last_focus_date";

export function localTodayYmd() {
  return new Date().toLocaleDateString("en-CA");
}

export function markFocusToday() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, localTodayYmd());
}

export function getLastFocusDateLocal() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}
