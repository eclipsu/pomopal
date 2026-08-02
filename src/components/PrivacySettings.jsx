"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";
import { useUser } from "@/hooks/useUser";

const TOGGLES = [
  { key: "profile_public", label: "Public profile (/username)" },
  { key: "show_online_status", label: "Show online status" },
  { key: "show_current_activity", label: "Show last active" },
  { key: "show_daily_stats", label: "Show daily stats on profile" },
  { key: "show_streak", label: "Show streak on profile" },
  { key: "show_total_focus_time", label: "Show total focus time on profile" },
  { key: "show_on_leaderboard", label: "Appear on leaderboard" },
];

async function revalidateOwnProfile(username) {
  if (!username) return;
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ path: `/${username}` }),
    });
  } catch {
    // ISR bust is best-effort
  }
}

export default function PrivacySettings() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    axiosClient
      .get("/privacy")
      .then(({ data }) => setSettings(data))
      .catch(() => {});
  }, []);

  const toggle = async (key) => {
    const prev = settings;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaving(key);
    try {
      await axiosClient.patch("/privacy", { [key]: next[key] });
      queryClient.setQueryData(["privacy"], next);
      queryClient.invalidateQueries({ queryKey: ["privacy"] });
      if (key === "show_on_leaderboard") {
        queryClient.invalidateQueries({
          queryKey: ["leaderboard", "global", "alltime"],
        });
      }
      // Profile visibility / stats affect the public /username page.
      if (
        key === "profile_public" ||
        key === "show_daily_stats" ||
        key === "show_streak" ||
        key === "show_total_focus_time"
      ) {
        await revalidateOwnProfile(user?.username);
      }
    } catch {
      setSettings(prev);
    } finally {
      setSaving(null);
    }
  };

  if (!settings) return null;

  return (
    <div className="mt-5">
      <div className="h-px w-full bg-gray-200 mb-4" />
      <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">
        Privacy
      </h2>
      <div className="space-y-2">
        {TOGGLES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-gray-600 text-sm">{label}</span>
            <button
              type="button"
              onClick={() => toggle(key)}
              disabled={saving === key}
              aria-pressed={Boolean(settings[key])}
              className={`relative h-5 w-10 shrink-0 rounded-full transition-colors duration-200 ${
                settings[key] ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  settings[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
