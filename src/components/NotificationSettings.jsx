"use client";

import { useNotificationPreferences } from "@/hooks/useNotifications";

const TOGGLES = [
  { key: "streak_updates", label: "Streak & session updates" },
  { key: "streak_nudges", label: "Streak reminders & daily nudges" },
  { key: "inactive_reminders", label: "Comeback reminders" },
  { key: "product_announcements", label: "Product announcements" },
];

export default function NotificationSettings() {
  const { preferences, isLoading, updatePreference, saving } = useNotificationPreferences();

  if (isLoading || !preferences) return null;

  return (
    <div className="mt-5">
      <div className="h-px w-full bg-gray-200 mb-4" />
      <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3">
        Notifications
      </h2>
      <div className="space-y-2">
        {TOGGLES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">{label}</span>
            <button
              type="button"
              onClick={() => updatePreference(key, !preferences[key])}
              disabled={saving}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                preferences[key] ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  preferences[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
