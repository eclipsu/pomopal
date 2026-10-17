/**
 * Browser-side focus notifications: the "you paused and never came back"
 * nudge and the "session done" ping. The backend owns the in-app copy for
 * signed-in users; this only surfaces it as a system notification.
 */
import { clearTimeout, setTimeout } from "worker-timers";

const pick = (items) => items[Math.floor(Math.random() * items.length)];

/** Same window the backend uses (10–20 min). */
export const PAUSE_NUDGE_MIN_MS = 10 * 60 * 1000;
export const PAUSE_NUDGE_MAX_MS = 20 * 60 * 1000;

export function randomPauseNudgeDelay() {
  return (
    PAUSE_NUDGE_MIN_MS +
    Math.floor(Math.random() * (PAUSE_NUDGE_MAX_MS - PAUSE_NUDGE_MIN_MS))
  );
}

export function pauseNudgeCopy(minutesLeft) {
  return {
    title: "You paused…",
    body: pick([
      "What happened to locking in bro? 🔒",
      "Are you gonna go study or what lmao ffs 💀",
      `${minutesLeft} min left. Finish it. 😤`,
      "Your pomodoro is sitting there paused. Lonely. Cold. Go back. 🥶",
      "Phone down. Hit play. 📵",
    ]),
  };
}

/** mode: 0 pomodoro, 1 short break, 2 long break; next: mode that's up next. */
export function finishedCopy(mode, next) {
  if (mode === 0) {
    return {
      title: next === 2 ? "Pomodoro done — long break earned 🛋️" : "Pomodoro done ✅",
      body: pick([
        "W. That's it. Just W. 🫠",
        "You did a pomodoro and didn't die. Growth. 💪",
        "Entire session of not being a coward. Respect. 👍",
      ]),
    };
  }
  return {
    title: "Break's over ⏰",
    body: pick([
      "Back to it. The grind misses you. 😤",
      "Break's done. Lock in. 🔒",
      "Okay that's enough scrolling. Hit play. 📵",
    ]),
  };
}

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Ask once, from a user gesture (e.g. pressing play). Never nags after a "no". */
export function ensureNotificationPermission() {
  if (!notificationsSupported()) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

/** System notification, only when the tab isn't in front (otherwise the UI shows it). */
export function showSystemNotification({ title, body, tag }) {
  if (!notificationsSupported() || Notification.permission !== "granted") {
    return false;
  }
  if (typeof document !== "undefined" && document.visibilityState === "visible") {
    return false;
  }
  try {
    const n = new Notification(title, { body, tag, icon: "/icon.png" });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}

/** One pending pause nudge at a time. */
let pendingNudge = null;

export function schedulePauseNudge(atMs, fire) {
  cancelPauseNudge();
  const delay = Math.max(0, atMs - Date.now());
  pendingNudge = setTimeout(() => {
    pendingNudge = null;
    fire();
  }, delay);
}

export function cancelPauseNudge() {
  if (pendingNudge != null) {
    clearTimeout(pendingNudge);
    pendingNudge = null;
  }
}
