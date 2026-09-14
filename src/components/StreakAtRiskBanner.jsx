"use client";

import { useStreak } from "@/hooks/useStreak";
import { useNotifications } from "@/hooks/useNotifications";
import { streakAtRiskMessage } from "@/lib/streakStatus";

export default function StreakAtRiskBanner({ onStartFocus }) {
  const { status, streak, graceDaysRemaining } = useStreak();
  const { notifications } = useNotifications({ enabled: status === "at_risk" });

  if (status !== "at_risk" || streak <= 0) return null;

  const nudge = notifications.find(
    (n) =>
      (n.type === "streak_update" || n.type === "streak_at_risk") && !n.read_at,
  );

  const message =
    nudge?.body ?? streakAtRiskMessage(streak, graceDaysRemaining);

  return (
    <div className="mx-auto mb-4 flex w-11/12 max-w-lg flex-col gap-3 rounded-2xl border-2 border-[#ffc800] border-b-4 bg-[#fff4e5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl ring-2 ring-inset ring-[#ffc800]">
          🔥
        </span>
        <p className="pt-1 text-sm font-bold leading-snug text-[#3c3c3c]">
          {message}
        </p>
      </div>
      {onStartFocus && (
        <button
          type="button"
          onClick={onStartFocus}
          className="shrink-0 rounded-2xl border-2 border-[#58cc02] border-b-4 bg-[#58cc02] px-4 py-2 text-sm font-extrabold text-white transition active:translate-y-0.5 active:border-b-2"
        >
          Start a pomodoro
        </button>
      )}
    </div>
  );
}
