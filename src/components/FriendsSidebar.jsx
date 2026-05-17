"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X, UserPlus, Users, Trophy } from "lucide-react";
import { FriendsProvider, useFriends } from "@/contexts/FriendsContext";
import { PresenceProvider, usePresence } from "@/contexts/PresenceContext";
import SendInviteModal from "./SendInviteModal";
import FriendProfilePanel from "./FriendProfilePanel";
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
    try {
      await onUnfriend(friend.id);
    } catch {
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 group transition-colors cursor-pointer"
    >
      <Avatar name={friend.name} avatarUrl={friend.avatar_url} status={status} />
      <div className="flex-1 min-w-0">
        <p
          onClick={onClick}
          className={`text-sm font-medium truncate cursor-pointer hover:underline ${status === "offline" ? "text-gray-400" : "text-white"}`}
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

function PendingRequests({ received, sent, onAccept, onCancel }) {
  if (!received.length && !sent.length) return null;

  return (
    <div className="mb-4 space-y-3">
      {received.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1">
            Requests — {received.length}
          </p>
          {received.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{r.requester?.name ?? "Someone"}</p>
                <p className="text-xs text-gray-500 truncate">Wants to be friends</p>
              </div>
              <button
                onClick={() => onAccept(r.id)}
                className="text-xs text-green-400 hover:text-green-300 px-2"
              >
                Accept
              </button>
              <button
                onClick={() => onCancel(r.id)}
                className="text-xs text-gray-500 hover:text-red-400 px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {sent.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-1">
            Sent — {sent.length}
          </p>
          {sent.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400 truncate">
                  {r.addressee?.email ?? r.addressee?.name ?? "Pending invite"}
                </p>
                <p className="text-xs text-gray-600">Awaiting response</p>
              </div>
              <button
                onClick={() => onCancel(r.id)}
                className="text-xs text-gray-500 hover:text-red-400 px-2"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FriendsSidebarInner({ open, onClose }) {
  const {
    friends,
    pendingReceived,
    pendingSent,
    loading,
    error,
    refreshAll,
    unfriend,
    acceptPending,
    cancelPending,
  } = useFriends();
  const presence = usePresence();
  const presenceMap = presence?.presenceMap ?? {};
  const subscribeTo = presence?.subscribeTo;
  const unsubscribeFrom = presence?.unsubscribeFrom;
  const subscribedRef = useRef(new Set());
  const [showInvite, setShowInvite] = useState(false);
  const [tab, setTab] = useState("friends");
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    if (open) refreshAll();
  }, [open, refreshAll]);

  useEffect(() => {
    if (!open) {
      subscribedRef.current.forEach((id) => unsubscribeFrom?.(id));
      subscribedRef.current.clear();
      return;
    }

    const currentIds = new Set(friends.map((f) => f.id).filter(Boolean));

    subscribedRef.current.forEach((id) => {
      if (!currentIds.has(id)) {
        unsubscribeFrom?.(id);
        subscribedRef.current.delete(id);
      }
    });

    friends.forEach((f) => {
      if (!f.id || subscribedRef.current.has(f.id)) return;
      subscribeTo?.(f.id);
      subscribedRef.current.add(f.id);
    });
  }, [open, friends, subscribeTo, unsubscribeFrom]);

  useEffect(() => {
    return () => {
      subscribedRef.current.forEach((id) => unsubscribeFrom?.(id));
      subscribedRef.current.clear();
    };
  }, [unsubscribeFrom]);

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
            {error && <p className="text-xs text-red-400 px-2 py-2 mb-2">{error}</p>}

            <PendingRequests
              received={pendingReceived}
              sent={pendingSent}
              onAccept={acceptPending}
              onCancel={cancelPending}
            />

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

            {!loading &&
              friends.length === 0 &&
              pendingReceived.length === 0 &&
              pendingSent.length === 0 && (
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

      </div>

      {selectedFriend && (
        <FriendProfilePanel
          friendId={selectedFriend.id}
          presence={presenceMap[selectedFriend.id]}
          onClose={() => setSelectedFriend(null)}
        />
      )}

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />}
      <SendInviteModal open={showInvite} onClose={() => setShowInvite(false)} />
    </>
  );
}

export default function FriendsSidebar(props) {
  return (
    <FriendsProvider>
      <PresenceProvider>
        <FriendsSidebarInner {...props} />
      </PresenceProvider>
    </FriendsProvider>
  );
}
