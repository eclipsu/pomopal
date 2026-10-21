"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, UserPlus, Users, Trophy } from "lucide-react";
import { FriendsProvider, useFriends } from "@/contexts/FriendsContext";
import { usePresence } from "@/contexts/PresenceContext";
import SendInviteModal from "./SendInviteModal";
import { formatPresenceSubtitle } from "@/utils/formatLastActive";
import axiosClient from "@/utils/axios";

const STATUS_DOT = {
  online: "bg-green-400",
  idle: "bg-yellow-400",
  offline: "bg-white/25",
};

const TAB_ON = "bg-white/15 text-white";
const TAB_OFF = "text-white/60 hover:bg-white/10 hover:text-white";
const ICON_BTN =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white";

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
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden text-xs font-medium text-white/70">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${STATUS_DOT[status] ?? "bg-white/25"}`}
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
      onKeyDown={
        onClick
          ? (e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`flex min-h-[44px] items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 group transition-colors focus-visible:outline-none focus-visible:bg-white/10 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <Avatar name={friend.name} avatarUrl={friend.avatar_url} status={status} />
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${status === "offline" ? "text-white/50" : "text-white"}`}
        >
          {friend.name}
        </p>
        <p className="text-xs text-white/40 truncate">
          {formatPresenceSubtitle(presence)}
        </p>
      </div>
      <button
        onClick={handleUnfriend}
        onBlur={() => setConfirming(false)}
        disabled={loading}
        aria-label={confirming ? `Confirm unfriend ${friend.name}` : `Unfriend ${friend.name}`}
        className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs transition-[opacity,color,background-color] hover:bg-white/10 focus-visible:opacity-100 md:group-hover:opacity-100 ${
          confirming
            ? "opacity-100 text-red-400"
            : "text-white/40 hover:text-red-400 md:opacity-0"
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
      <div className="flex gap-1 p-2 border-b border-white/10 shrink-0">
        {["today", "week", "alltime"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 h-8 text-xs rounded-lg transition-colors ${
              period === p ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
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
              <div className="w-6 h-4 bg-white/10 rounded animate-pulse" />
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
                <div className="h-2.5 bg-white/5 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <Trophy className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-white/40 text-xs">No data yet. Start focusing!</p>
          </div>
        )}
        {!loading &&
          entries.map((entry) => (
            <div
              key={entry.user_id}
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="w-6 text-center text-sm">
                {MEDAL[entry.rank] ?? <span className="text-white/40 text-xs">{entry.rank}</span>}
              </span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/70 overflow-hidden shrink-0">
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
                <p className="text-xs text-white/40">
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
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 mb-1">
            Requests — {received.length}
          </p>
          {received.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{r.requester?.name ?? "Someone"}</p>
                <p className="text-xs text-white/40 truncate">Wants to be friends</p>
              </div>
              <button
                onClick={() => onAccept(r.id)}
                className="h-8 rounded-lg bg-white px-3 text-xs font-semibold text-gray-900 transition-colors hover:bg-red-50"
              >
                Accept
              </button>
              <button
                onClick={() => onCancel(r.id)}
                aria-label="Decline request"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {sent.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 mb-1">
            Sent — {sent.length}
          </p>
          {sent.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/60 truncate">
                  {r.addressee?.email ?? r.addressee?.name ?? "Pending invite"}
                </p>
                <p className="text-xs text-white/30">Awaiting response</p>
              </div>
              <button
                onClick={() => onCancel(r.id)}
                className="h-8 rounded-lg px-2 text-xs text-white/40 transition-colors hover:bg-white/10 hover:text-red-400"
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
  const router = useRouter();
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
  // Flip a frame after `open` so the slide transition runs on first mount too.
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(open));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !showInvite) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, showInvite]);

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

  const openFriendProfile = useCallback(
    (friend) => {
      if (!friend?.username) return;
      router.push(`/${friend.username}`);
      onClose?.();
    },
    [router, onClose],
  );

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
      <aside
        aria-label="Friends"
        aria-hidden={!open}
        inert={!open}
        className={`fixed top-0 right-0 z-40 flex h-dvh w-[min(20rem,85vw)] flex-col border-l border-white/10 bg-gray-900/95 text-white shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-300 ease-out will-change-transform md:w-60 md:shadow-none ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-white/10 shrink-0">
          <div className="flex gap-0.5 rounded-xl bg-white/[0.06] p-0.5 ring-1 ring-white/10" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "friends"}
              onClick={() => setTab("friends")}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors ${
                tab === "friends" ? TAB_ON : TAB_OFF
              }`}
            >
              <Users className="w-4 h-4" strokeWidth={1.75} /> Friends
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "leaderboard"}
              aria-label="Leaderboard"
              title="Leaderboard"
              onClick={() => setTab("leaderboard")}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                tab === "leaderboard" ? TAB_ON : TAB_OFF
              }`}
            >
              <Trophy className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              aria-label="Add a friend"
              title="Add a friend"
              className={ICON_BTN}
            >
              <UserPlus className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close friends"
              title="Close"
              className={ICON_BTN}
            >
              <X className="w-[18px] h-[18px]" strokeWidth={1.75} />
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
                  <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-white/10 rounded animate-pulse w-3/4" />
                    <div className="h-2.5 bg-white/5 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}

            {!loading &&
              friends.length === 0 &&
              pendingReceived.length === 0 &&
              pendingSent.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <Users className="w-8 h-8 text-white/20 mb-3" />
                <p className="text-white/40 text-xs">No friends yet.</p>
                <button
                  onClick={() => setShowInvite(true)}
                  className="mt-3 h-9 rounded-xl bg-white px-4 text-xs font-semibold text-gray-900 transition-colors hover:bg-red-50"
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
                      <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-2 mb-1">
                        {label} — {list.length}
                      </p>
                      {list.map((f) => (
                        <FriendRow
                          key={f.id}
                          friend={f}
                          presence={presenceMap[f.id]}
                          onUnfriend={unfriend}
                          onClick={f.username ? () => openFriendProfile(f) : undefined}
                        />
                      ))}
                    </div>
                  ),
              )}
          </div>
        )}

      </aside>

      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 md:hidden ${
          shown ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <SendInviteModal open={showInvite} onClose={() => setShowInvite(false)} />
    </>
  );
}

export default function FriendsSidebar(props) {
  return (
    <FriendsProvider>
      <FriendsSidebarInner {...props} />
    </FriendsProvider>
  );
}
