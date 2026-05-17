"use client";

import { useEffect, useState } from "react";
import { Users, Trophy, Flame, Clock, BarChart3, ChevronLeft, EyeOff } from "lucide-react";
import axiosClient from "@/utils/axios";

function formatFocusMinutes(mins) {
  if (mins == null) return "—";
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

const STATUS_DOT = {
  online: "bg-green-400",
  idle: "bg-yellow-400",
  offline: "bg-gray-600",
};

function Avatar({ name, avatarUrl, status }) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="relative shrink-0">
      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden text-sm font-medium text-gray-300">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1d24] ${STATUS_DOT[status] ?? "bg-gray-600"}`}
        />
      )}
    </div>
  );
}

function ProfileStatRow({ icon: Icon, label, value, isPrivate, privateLabel = "Private" }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-700/40 last:border-0">
      <Icon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        {isPrivate ? (
          <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
            <EyeOff className="w-3.5 h-3.5" />
            {privateLabel}
          </p>
        ) : (
          <div className="text-sm text-white font-medium mt-0.5">{value}</div>
        )}
      </div>
    </div>
  );
}

export default function FriendProfilePanel({ friendId, presence, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!friendId) return;
    setLoading(true);
    axiosClient
      .get(`/friends/${friendId}`)
      .then(({ data }) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [friendId]);

  const v = profile?.visibility ?? {};
  const p = presence ?? {};
  const status = profile?.status ?? p.status;
  const activity = profile?.current_activity ?? p.current_activity;
  const customStatus = profile?.custom_status ?? p.custom_status;
  const lastSeen = profile?.last_seen_at ?? p.last_seen_at;

  const statusLabel =
    status === "online" ? "Online" : status === "idle" ? "Idle" : status === "offline" ? "Offline" : "Unknown";

  return (
    <div
      className="fixed top-0 right-60 h-full w-72 z-50 flex flex-col border-l border-gray-700/50 shadow-2xl"
      style={{ backgroundColor: "#1a1d24" }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50 shrink-0">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-sm font-semibold text-white">Profile</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="space-y-3">
            <div className="h-14 bg-gray-700/50 rounded-xl animate-pulse" />
            <div className="h-24 bg-gray-700/50 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-700/50 rounded-xl animate-pulse" />
          </div>
        )}

        {!loading && !profile && (
          <p className="text-sm text-gray-500 text-center py-8">Could not load profile.</p>
        )}

        {!loading && profile && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <Avatar
                name={profile.name}
                avatarUrl={profile.avatar_url}
                status={v.show_online_status ? status : undefined}
              />
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{profile.name}</p>
                {v.show_current_activity && (activity || customStatus) && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {activity || customStatus}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-gray-800/60 px-3 py-1">
              <ProfileStatRow
                icon={Users}
                label="Online status"
                isPrivate={!v.show_online_status}
                value={
                  <span>
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${
                        status === "online"
                          ? "bg-green-400"
                          : status === "idle"
                            ? "bg-yellow-400"
                            : "bg-gray-600"
                      }`}
                    />
                    {statusLabel}
                    {status === "offline" && lastSeen && (
                      <span className="block text-xs text-gray-500 font-normal mt-0.5">
                        Last seen {new Date(lastSeen).toLocaleString()}
                      </span>
                    )}
                  </span>
                }
              />

              <ProfileStatRow
                icon={Clock}
                label="Current activity"
                isPrivate={!v.show_current_activity}
                value={activity || customStatus || "—"}
              />

              <ProfileStatRow
                icon={BarChart3}
                label="Today's focus"
                isPrivate={!v.show_daily_stats}
                value={formatFocusMinutes(profile.today_focus_minutes ?? 0)}
              />

              <ProfileStatRow
                icon={Flame}
                label="Streak"
                isPrivate={!v.show_streak}
                value={`${profile.streak ?? 0} days · best ${profile.longest_streak ?? 0}`}
              />

              <ProfileStatRow
                icon={Clock}
                label="Total focus time"
                isPrivate={!v.show_total_focus_time}
                value={formatFocusMinutes(profile.total_focus_minutes ?? 0)}
              />

              <ProfileStatRow
                icon={Trophy}
                label="Leaderboard (this week)"
                isPrivate={!v.show_on_leaderboard}
                privateLabel="Hidden from leaderboard"
                value={
                  profile.leaderboard_rank != null
                    ? `#${profile.leaderboard_rank} among friends`
                    : "Not ranked yet"
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
