"use client";

import { useEffect, useState, useCallback } from "react";
import { X, UserPlus, Users, Trophy } from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { usePresence } from "@/contexts/PresenceContext";
import SendInviteModal from "./SendInviteModal";
import axiosClient from "@/utils/axios";
import { Flame } from "lucide-react";

const STATUS_DOT = {
  online: "bg-green-400",
  idle: "bg-yellow-400",
  offline: "bg-gray-600",
};

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

function Avatar({ name, avatarUrl, status }) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="relative shrink-0">
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden text-xs font-medium text-gray-300">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#1a1d24] ${STATUS_DOT[status] ?? "bg-gray-600"}`}
        />
      )}
    </div>
  );
}

function FriendProfileModal({ friend, presence, onClose }) {
  if (!friend) return null;
  const p = presence ?? {};
  const streak = friend.streak ?? 0;
  const longestStreak = friend.longest_streak ?? 0;
  return (
    <div className="absolute inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div className="w-full bg-gray-800 rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <Avatar name={friend.name} avatarUrl={friend.avatar_url} status={p.status} />
          <div>
            <p className="text-white font-semibold">{friend.name}</p>
            {(p.current_activity || p.custom_status) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {p.current_activity || p.custom_status}
              </p>
            )}
          </div>
          <span
            className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              p.status === "online"
                ? "bg-green-500/20 text-green-400"
                : p.status === "idle"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-gray-700 text-gray-500"
            }`}
          >
            {p.status ?? "offline"}
          </span>
        </div>

        {/* Streak stats */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-gray-700/50 rounded-xl px-3 py-2.5">
            <Flame
              className={`w-4 h-4 shrink-0 ${streak > 0 ? "text-orange-400" : "text-gray-600"}`}
            />
            <div>
              <p className="text-white text-sm font-semibold leading-none">{streak}</p>
              <p className="text-gray-500 text-xs mt-0.5">Current streak</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-gray-700/50 rounded-xl px-3 py-2.5">
            <Trophy
              className={`w-4 h-4 shrink-0 ${longestStreak > 0 ? "text-yellow-400" : "text-gray-600"}`}
            />
            <div>
              <p className="text-white text-sm font-semibold leading-none">{longestStreak}</p>
              <p className="text-gray-500 text-xs mt-0.5">Longest streak</p>
            </div>
          </div>
        </div>

        {p.last_seen_at && p.status === "offline" && (
          <p className="text-xs text-gray-600">
            Last seen {new Date(p.last_seen_at).toLocaleString()}
          </p>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-gray-500 hover:text-white transition-colors py-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function FriendRow({ friend, presence, onUnfriend, onClick }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const status = presence?.status ?? friend.status ?? "offline";

  const handleUnfriend = async (e) => {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    await onUnfriend(friend.id);
    setLoading(false);
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 group transition-colors cursor-pointer"
    >
      <Avatar name={friend.name} avatarUrl={friend.avatar_url} status={status} />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${status === "offline" ? "text-gray-400" : "text-white"}`}
        >
          {friend.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {presence?.current_activity || presence?.custom_status || status}
        </p>
      </div>
      <button
        onClick={handleUnfriend}
        onBlur={() => setConfirming(false)}
        disabled={loading}
        className={`opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded transition-all ${
          confirming ? "opacity-100 text-red-400" : "text-gray-500 hover:text-red-400"
        }`}
      >
        {loading ? "..." : confirming ? "Sure?" : "✕"}
      </button>
    </div>
  );
}

function LeaderboardTab() {
  const [period, setPeriod] = useState("week");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (p) => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get(`/leaderboard?period=${p}`);
      setEntries(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex gap-1 px-2 py-2 border-b border-gray-700/50 shrink-0">
        {["today", "week", "alltime"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
              period === p ? "bg-red-500/20 text-red-400" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {p === "alltime" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading &&
          [...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 px-2 py-2">
              <div className="w-6 h-4 bg-gray-700 rounded animate-pulse" />
              <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-2.5 bg-gray-700/50 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Trophy className="w-8 h-8 text-gray-700 mb-2" />
            <p className="text-gray-500 text-xs">No data yet. Start focusing!</p>
          </div>
        )}
        {!loading &&
          entries.map((entry) => (
            <div
              key={entry.user_id}
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="w-6 text-center text-sm">
                {MEDAL[entry.rank] ?? <span className="text-gray-500 text-xs">{entry.rank}</span>}
              </span>
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300 overflow-hidden shrink-0">
                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  entry.name?.[0]?.toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{entry.name}</p>
                <p className="text-xs text-gray-500">
                  {Math.floor(entry.focus_minutes / 60)}h {entry.focus_minutes % 60}m
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function FriendsSidebar({ open, onClose }) {
  const { friends, loading, fetchFriends, unfriend } = useFriends();
  const presence = usePresence();
  const presenceMap = presence?.presenceMap ?? {};
  const subscribeTo = presence?.subscribeTo;
  const [showInvite, setShowInvite] = useState(false);
  const [tab, setTab] = useState("friends");
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    if (open) fetchFriends();
  }, [open]);

  useEffect(() => {
    friends.forEach((f) => subscribeTo?.(f.id));
  }, [friends]);

  const byStatus = (s) =>
    friends.filter((f) => (presenceMap[f.id]?.status ?? f.status ?? "offline") === s);
  const online = byStatus("online");
  const idle = byStatus("idle");
  const offline = friends.filter((f) => {
    const s = presenceMap[f.id]?.status ?? f.status ?? "offline";
    return s === "offline" || !s;
  });

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full w-60 flex flex-col z-40 border-l border-gray-700/50 transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: "#1a1d24" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700/50 shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setTab("friends")}
              className={`flex items-center gap-1.5 text-sm font-semibold px-2 py-1 rounded-lg transition-colors ${
                tab === "friends" ? "text-white bg-white/10" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Friends
            </button>
            <button
              onClick={() => setTab("leaderboard")}
              className={`flex items-center gap-1.5 text-sm font-semibold px-2 py-1 rounded-lg transition-colors ${
                tab === "leaderboard"
                  ? "text-white bg-white/10"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvite(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {tab === "leaderboard" ? (
          <LeaderboardTab />
        ) : (
          <div className="flex-1 overflow-y-auto px-2 py-3">
            {loading &&
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-gray-700/50 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}

            {!loading && friends.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <Users className="w-8 h-8 text-gray-700 mb-3" />
                <p className="text-gray-500 text-xs">No friends yet.</p>
                <button
                  onClick={() => setShowInvite(true)}
                  className="mt-3 text-xs text-red-400 hover:text-red-300"
                >
                  + Add a friend
                </button>
              </div>
            )}

            {!loading &&
              [
                { label: "Online", list: online },
                { label: "Idle", list: idle },
                { label: "Offline", list: offline },
              ].map(
                ({ label, list }) =>
                  list.length > 0 && (
                    <div key={label} className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1">
                        {label} — {list.length}
                      </p>
                      {list.map((f) => (
                        <FriendRow
                          key={f.id}
                          friend={f}
                          presence={presenceMap[f.id]}
                          onUnfriend={unfriend}
                          onClick={() => setSelectedFriend(f)}
                        />
                      ))}
                    </div>
                  ),
              )}
          </div>
        )}

        {selectedFriend && (
          <FriendProfileModal
            friend={selectedFriend}
            presence={presenceMap[selectedFriend.id]}
            onClose={() => setSelectedFriend(null)}
          />
        )}
      </div>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />}
      <SendInviteModal open={showInvite} onClose={() => setShowInvite(false)} />
    </>
  );
}
