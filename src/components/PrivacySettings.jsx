"use client";

import { useEffect, useState } from "react";
import axiosClient from "@/utils/axios";

const TOGGLES = [
  { key: "show_online_status", label: "Show online status" },
  { key: "show_current_activity", label: "Show current activity" },
  { key: "show_daily_stats", label: "Show daily stats" },
  { key: "show_streak", label: "Show streak" },
  { key: "show_total_focus_time", label: "Show total focus time" },
  { key: "show_on_leaderboard", label: "Appear on leaderboard" },
];

export default function PrivacySettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    axiosClient
      .get("/privacy")
      .then(({ data }) => setSettings(data))
      .catch(() => {});
  }, []);

  const toggle = async (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaving(key);
    try {
      await axiosClient.patch("/privacy", { [key]: next[key] });
    } catch {
      setSettings(settings);
    } finally {
      setSaving(null);
    }
  };

  if (!settings) return null;

  return (
    <div className="mt-5">
      <div className="h-px w-full bg-gray-200 mb-4" />
      <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">Privacy</h2>
      <div className="space-y-2">
        {TOGGLES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">{label}</span>
            <button
              onClick={() => toggle(key)}
              disabled={saving === key}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                settings[key] ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
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
