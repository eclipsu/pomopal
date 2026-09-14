"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatLastActive } from "@/utils/formatLastActive";

const TYPE_ICON = {
  announcement: "📢",
  streak_at_risk: "🔥",
  streak_milestone: "🏆",
  daily_nudge: "⏱",
  comeback: "🍅",
  focus_complete: "✅",
};

function NotificationRow({ item, onRead }) {
  const unread = !item.read_at;
  return (
    <button
      type="button"
      onClick={() => onRead(item.id)}
      className={`w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors border-b border-gray-700/40 last:border-0 ${
        unread ? "bg-white/[0.03]" : ""
      }`}
    >
      <div className="flex gap-2 items-start">
        <span className="text-base shrink-0">{TYPE_ICON[item.type] ?? "🔔"}</span>
        <div className="min-w-0 flex-1">
          <p className={`text-sm truncate ${unread ? "text-white font-medium" : "text-gray-300"}`}>
            {item.title}
          </p>
          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.body}</p>
          <p className="text-[10px] text-gray-600 mt-1">
            {formatLastActive(item.created_at) ?? "recently"}
          </p>
        </div>
        {unread && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />}
      </div>
    </button>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const { unreadCount, notifications, markRead, markAllRead, refetch, isLoading } =
    useNotifications();

  useEffect(() => {
    if (!open) return;
    refetch();
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, refetch]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative text-2xl text-white hover:text-gray-300 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden rounded-xl border border-gray-700/60 shadow-2xl z-50 flex flex-col"
          style={{ backgroundColor: "#1a1d24" }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50 shrink-0">
            <p className="text-sm font-semibold text-white">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {isLoading && (
              <p className="text-sm text-gray-500 px-3 py-4 text-center">Loading…</p>
            )}
            {!isLoading && notifications.length === 0 && (
              <p className="text-sm text-gray-500 px-3 py-6 text-center">No notifications yet</p>
            )}
            {!isLoading &&
              notifications.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onRead={(id) => {
                    markRead(id);
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
