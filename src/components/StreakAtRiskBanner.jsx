"use client";

import { useStreak } from "@/hooks/useStreak";
import { useNotifications } from "@/hooks/useNotifications";

export default function StreakAtRiskBanner({ onStartFocus }) {
  const { status, streak } = useStreak();
  const { notifications } = useNotifications({ enabled: status === "at_risk" });

  if (status !== "at_risk" || streak <= 0) return null;

  const nudge = notifications.find(
    (n) => n.type === "streak_at_risk" && !n.read_at,
  );

  const message =
    nudge?.body ??
    `Your ${streak}-day streak ends if you skip today. One pomodoro keeps it alive.`;

  return (
    <div className="mx-auto w-11/12 max-w-lg mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-sm text-amber-100">{message}</p>
      {onStartFocus && (
        <button
          type="button"
          onClick={onStartFocus}
          className="shrink-0 text-sm font-semibold text-amber-200 hover:text-white underline-offset-2 hover:underline"
        >
          Start a pomodoro
        </button>
      )}
    </div>
  );
}
