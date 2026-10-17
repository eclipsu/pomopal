"use client";

import { useCallback, useRef, useState } from "react";
import { Flame, Snowflake, Wrench } from "lucide-react";
import { useRepairStreak, useStreak } from "@/hooks/useStreak";
import { useDismiss } from "@/hooks/useDismiss";
import { STREAK_STATUS_LABELS, streakAtRiskMessage } from "@/lib/streakStatus";

export const STYLES = {
  active: "text-orange-500 fill-orange-500",
  at_risk: "text-blue-400 fill-blue-400/30",
  inactive: "text-gray-500 fill-transparent opacity-60",
};

function StreakPanel({ data, onClose }) {
  const {
    streak,
    status,
    graceDaysRemaining,
    freezes,
    maxFreezes,
    freezeProgress,
    freezeEarnEvery,
    freezesPending,
    pausedToday,
    repair,
    protectionSupported,
  } = data;
  const repairMutation = useRepairStreak();
  const repairError = repairMutation.error?.response?.data?.message;

  let headline;
  if (pausedToday) {
    headline = "Streaks are paused today — missing it won't cost you anything.";
  } else if (status === "active") {
    headline = "You focused today. Nice.";
  } else if (status === "at_risk") {
    headline = streakAtRiskMessage(streak, graceDaysRemaining, freezesPending);
  } else {
    headline = "Start a pomodoro to begin a new streak.";
  }

  return (
    <div
      role="dialog"
      aria-label="Streak details"
      className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/10 bg-neutral-900/95 p-4 text-left text-sm text-white shadow-xl backdrop-blur"
    >
      <div className="flex items-center gap-2">
        <Flame className={`h-5 w-5 ${STYLES[status]}`} strokeWidth={2} />
        <span className="text-base font-semibold tabular-nums">
          {streak} day streak
        </span>
      </div>
      <p className="mt-1 text-white/70">{headline}</p>

      {protectionSupported && (
      <div className="mt-4 rounded-lg bg-white/5 p-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Streak freezes</span>
          <span className="flex gap-1" aria-label={`${freezes} of ${maxFreezes} freezes`}>
            {Array.from({ length: maxFreezes }, (_, i) => (
              <Snowflake
                key={i}
                className={`h-4 w-4 ${i < freezes ? "text-sky-300" : "text-white/20"}`}
                strokeWidth={2}
              />
            ))}
          </span>
        </div>
        <p className="mt-1 text-xs text-white/60">
          A freeze covers a missed day automatically.
          {freezes < maxFreezes
            ? ` Next one in ${freezeEarnEvery - freezeProgress} focus day${
                freezeEarnEvery - freezeProgress === 1 ? "" : "s"
              }.`
            : " You're holding the max."}
        </p>
        {freezes < maxFreezes && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-sky-300"
              style={{ width: `${(freezeProgress / freezeEarnEvery) * 100}%` }}
            />
          </div>
        )}
      </div>
      )}

      {repair?.repairable && (
        <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
          <p className="text-amber-100">
            Your streak broke recently. Repair it back to{" "}
            <span className="font-semibold">{repair.streak} days</span> — you get
            one repair a month.
          </p>
          <button
            type="button"
            disabled={repairMutation.isPending}
            onClick={() => repairMutation.mutate()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-400 px-3 py-1.5 text-sm font-semibold text-neutral-900 hover:bg-amber-300 disabled:opacity-60"
          >
            <Wrench className="h-4 w-4" strokeWidth={2} />
            {repairMutation.isPending ? "Repairing…" : "Repair streak"}
          </button>
          {repairError && (
            <p className="mt-1 text-xs text-red-300">{repairError}</p>
          )}
        </div>
      )}

      {repair && !repair.repairable && repair.available_on && status !== "active" && (
        <p className="mt-3 text-xs text-white/50">
          Next streak repair available {repair.available_on}.
        </p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="sr-only focus:not-sr-only focus:mt-2 focus:underline"
      >
        Close
      </button>
    </div>
  );
}

export default function StreakIndicator({ className = "" }) {
  const data = useStreak();
  const { streak, status, freezes, repair, protectionSupported, isLoading, isError } = data;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  if (isLoading) {
    return (
      <span
        className={`inline-flex items-center ${className}`}
        title="Loading streak…"
        aria-hidden
      >
        <Flame className="h-7 w-7 text-gray-600 animate-pulse md:h-6 md:w-6" strokeWidth={1.75} />
      </span>
    );
  }

  if (isError) return null;

  const label = STREAK_STATUS_LABELS[status];
  const countLabel = streak > 0 ? `${streak} day streak` : label;

  return (
    <span ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center gap-1 rounded-lg px-1 py-0.5 hover:bg-white/10"
        title={`${countLabel} — ${label}`}
        aria-label={
          protectionSupported
            ? `${countLabel}, ${freezes} streak freeze${freezes === 1 ? "" : "s"}`
            : countLabel
        }
        aria-expanded={open}
      >
        <Flame className={`h-7 w-7 transition-colors md:h-6 md:w-6 ${STYLES[status]}`} strokeWidth={2} />
        {streak > 0 && (
          <span
            className={`text-sm font-semibold tabular-nums md:text-xs ${
              status === "active"
                ? "text-orange-400"
                : status === "at_risk"
                  ? "text-blue-400"
                  : "text-gray-500"
            }`}
          >
            {streak}
          </span>
        )}
        {freezes > 0 && (
          <span className="inline-flex items-center text-xs font-semibold text-sky-300 tabular-nums">
            <Snowflake className="h-3.5 w-3.5" strokeWidth={2} />
            {freezes}
          </span>
        )}
        {repair?.repairable && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" aria-hidden />
        )}
      </button>
      {open && <StreakPanel data={data} onClose={() => setOpen(false)} />}
    </span>
  );
}
