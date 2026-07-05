"use client";

import { Flame } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { STREAK_STATUS_LABELS } from "@/lib/streakStatus";

export const STYLES = {
  active: "text-orange-500 fill-orange-500",
  at_risk: "text-blue-400 fill-blue-400/30",
  inactive: "text-gray-500 fill-transparent opacity-60",
};

export default function StreakIndicator({ className = "" }) {
  const { streak, status, isLoading, isError } = useStreak();

  if (isLoading) {
    return (
      <span
        className={`inline-flex items-center ${className}`}
        title="Loading streak…"
        aria-hidden
      >
        <Flame className="h-6 w-6 text-gray-600 animate-pulse" strokeWidth={1.75} />
      </span>
    );
  }

  if (isError) return null;

  const label = STREAK_STATUS_LABELS[status];
  const countLabel = streak > 0 ? `${streak} day streak` : label;

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={`${countLabel} — ${label}`}
      aria-label={countLabel}
    >
      <Flame className={`h-6 w-6 transition-colors ${STYLES[status]}`} strokeWidth={2} />
      {streak > 0 && (
        <span
          className={`text-xs font-semibold tabular-nums ${
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
    </span>
  );
}
