"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { formatLastActive } from "@/utils/formatLastActive";

const TYPE_META = {
  announcement: { emoji: "📢", bg: "bg-[#ddf4ff]", ring: "ring-[#84d8ff]" },
  streak_update: { emoji: "🔥", bg: "bg-[#fff4e5]", ring: "ring-[#ff9600]" },
  streak_at_risk: { emoji: "🔥", bg: "bg-[#fff4e5]", ring: "ring-[#ffc800]" },
  streak_milestone: { emoji: "🏆", bg: "bg-[#ddf4ff]", ring: "ring-[#1cb0f6]" },
  daily_nudge: { emoji: "⏱", bg: "bg-[#e5f8d0]", ring: "ring-[#89e219]" },
  comeback: { emoji: "🍅", bg: "bg-[#ffdfe0]", ring: "ring-[#ff4b4b]" },
  focus_complete: { emoji: "✅", bg: "bg-[#e5f8d0]", ring: "ring-[#58cc02]" },
};

function TypeBadge({ type }) {
  const meta = TYPE_META[type] ?? {
    emoji: "🔔",
    bg: "bg-[#f0f0f0]",
    ring: "ring-[#e5e5e5]",
  };
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ring-2 ring-inset ${meta.bg} ${meta.ring}`}
      aria-hidden
    >
      {meta.emoji}
    </span>
  );
}

function NotificationRow({ item, onRead }) {
  const unread = !item.read_at;
  return (
    <button
      type="button"
      onClick={() => onRead(item.id)}
      className={`group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${
        unread
          ? "bg-[#f7fcf0] hover:bg-[#eef9e0]"
          : "bg-white hover:bg-[#f7f7f7]"
      }`}
    >
      <TypeBadge type={item.type} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start gap-2">
          <p
            className={`min-w-0 flex-1 text-[15px] leading-snug ${
              unread
                ? "font-bold text-[#3c3c3c]"
                : "font-semibold text-[#777777]"
            }`}
          >
            {item.title}
          </p>
          {unread && (
            <span
              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#58cc02]"
              aria-label="Unread"
            />
          )}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-[#777777] line-clamp-2">
          {item.body}
        </p>
        <p className="mt-1.5 text-xs font-medium text-[#afafaf]">
          {formatLastActive(item.created_at) ?? "just now"}
        </p>
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
    if (!open) return undefined;
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
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
          open
            ? "bg-white/15 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff4b4b] px-1 text-[10px] font-bold text-white ring-2 ring-gray-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 flex w-[min(92vw,22rem)] max-h-[28rem] flex-col overflow-hidden rounded-2xl border-2 border-[#e5e5e5] border-b-4 border-b-[#e5e5e5] bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-[#e5e5e5] px-4 py-3">
            <p className="text-base font-extrabold tracking-tight text-[#3c3c3c]">
              Notifications
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-bold text-[#1cb0f6] transition-colors hover:bg-[#ddf4ff]"
              >
                <CheckCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 divide-y divide-[#e5e5e5] overflow-y-auto">
            {isLoading && (
              <p className="px-4 py-8 text-center text-sm font-medium text-[#afafaf]">
                Loading…
              </p>
            )}
            {!isLoading && notifications.length === 0 && (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#e5f8d0] text-3xl ring-2 ring-inset ring-[#89e219]">
                  🔔
                </span>
                <p className="mt-4 text-[15px] font-extrabold text-[#3c3c3c]">
                  You&apos;re all caught up
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#777777]">
                  Streaks, focus wins, and product updates will show up here.
                </p>
              </div>
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
