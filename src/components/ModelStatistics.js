"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { FiX } from "react-icons/fi";
import { GrFormPreviousLink, GrFormNextLink } from "react-icons/gr";
import Box from "@mui/material/Box";
import { BarChart } from "@mui/x-charts/BarChart";
import { BarChart3, Clock, Flame, LayoutList, Trophy } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { useWeeklyAnalytics } from "@/hooks/useWeeklyAnalytics";
import { useAllTimeFocus } from "@/hooks/useAllTimeFocus";
import { useSessionNameBreakdown } from "@/hooks/useSessionNameBreakdown";
import { useGlobalLeaderboard } from "@/hooks/useGlobalLeaderboard";
import { usePrivacy } from "@/hooks/usePrivacy";
import { getWeekRange, datesInRange, todayYmdInTz } from "@/lib/weekDates";
import { STYLES } from "@/components/StreakIndicator";

const ACCENT = "#6366f1";
const BASE = "#cbd5e1";
const TABS = [
  { id: "summary", label: "Summary", icon: BarChart3 },
  { id: "sessions", label: "Sessions", icon: LayoutList },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
];
const LEADERBOARD_PERIODS = [
  { id: "week", label: "Last 7 days" },
  { id: "alltime", label: "All time" },
];
const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };
const X_LABELS_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const X_LABELS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

const StatCard = ({
  icon: Icon,
  value,
  label,
  styles = null,
  compactValue = false,
  className = "",
}) => (
  <div
    className={`bg-gray-50 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center w-full min-w-0 border border-gray-200 ${className}`}
  >
    <Icon className={`text-gray-400 mb-1 ${styles ?? ""}`} size={20} strokeWidth={2} />
    <div
      className={`text-gray-800 font-bold mb-0.5 font-mono tabular-nums text-center w-full leading-tight ${
        compactValue ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
      }`}
    >
      {value}
    </div>
    <div className="text-gray-500 text-[10px] sm:text-[11px] text-center leading-tight">{label}</div>
  </div>
);

function formatMinutes(minutes) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

function formatShortDate(ymd) {
  if (!ymd) return "—";
  const [y, m, d] = String(ymd).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function ModelStatistics({ setOpenSettings, openSettings }) {
  const { user } = useUser();
  const [tab, setTab] = useState("summary");
  const [leaderboardPeriod, setLeaderboardPeriod] = useState("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewport, setViewport] = useState({
    isMobile: false,
    isLandscapePhone: false,
    width: 1024,
    height: 768,
  });

  const updateViewport = useCallback(() => {
    if (typeof window === "undefined") return;
    setViewport({
      isMobile: window.matchMedia("(max-width: 640px)").matches,
      isLandscapePhone: window.matchMedia(
        "(max-width: 900px) and (orientation: landscape)",
      ).matches,
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    if (!openSettings) return undefined;

    updateViewport();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("orientationchange", updateViewport);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("orientationchange", updateViewport);
      document.body.style.overflow = prevOverflow;
    };
  }, [openSettings, updateViewport]);

  const xLabels =
    viewport.isMobile || viewport.isLandscapePhone ? X_LABELS_SHORT : X_LABELS_FULL;

  const { from, to } = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const { streak, longestStreak, status } = useStreak({ enabled: openSettings });

  const {
    data: calendarData,
    isLoading: loading,
    isError: error,
    refetch: refetchWeek,
  } = useWeeklyAnalytics(from, to, weekOffset, { enabled: openSettings });

  const {
    data: allTimeMinutes = 0,
    isLoading: allTimeLoading,
    refetch: refetchAllTime,
  } = useAllTimeFocus({ enabled: openSettings });

  const {
    data: namedSessions = [],
    refetch: refetchNamed,
  } = useSessionNameBreakdown({ enabled: openSettings && tab === "sessions" });

  const leaderboardEnabled = openSettings && tab === "leaderboard";

  const {
    data: weekBoard = [],
    isLoading: weekLoading,
    isError: weekError,
    refetch: refetchWeekBoard,
  } = useGlobalLeaderboard("week", { enabled: leaderboardEnabled });

  const {
    data: allTimeBoard = [],
    isLoading: allTimeBoardLoading,
    isError: allTimeBoardError,
    refetch: refetchAllTimeBoard,
  } = useGlobalLeaderboard("alltime", { enabled: leaderboardEnabled });

  const globalBoard = leaderboardPeriod === "week" ? weekBoard : allTimeBoard;
  const globalLoading =
    leaderboardPeriod === "week" ? weekLoading : allTimeBoardLoading;
  const globalError =
    leaderboardPeriod === "week" ? weekError : allTimeBoardError;
  const refetchGlobal =
    leaderboardPeriod === "week" ? refetchWeekBoard : refetchAllTimeBoard;

  const { data: privacy } = usePrivacy({
    enabled: openSettings && tab === "leaderboard",
  });
  const hiddenFromLeaderboard = privacy?.show_on_leaderboard === false;

  useEffect(() => {
    if (!openSettings) return;
    refetchWeek();
    refetchAllTime();
    if (tab === "sessions") refetchNamed();
    if (tab === "leaderboard") {
      refetchWeekBoard();
      refetchAllTimeBoard();
    }
  }, [
    openSettings,
    tab,
    from,
    to,
    refetchWeek,
    refetchAllTime,
    refetchNamed,
    refetchWeekBoard,
    refetchAllTimeBoard,
  ]);

  const safeDatesInRange = (fromVal, toVal) => {
    try {
      if (!fromVal || !toVal) return new Array(7).fill("");
      const arr = datesInRange(fromVal, toVal);
      if (!Array.isArray(arr) || arr.length !== 7) return new Array(7).fill("");
      return arr;
    } catch (e) {
      return new Array(7).fill("");
    }
  };

  const weeklyMinutes = useMemo(() => {
    if (!calendarData || !Array.isArray(calendarData) || !from || !to) return new Array(7).fill(0);
    try {
      const map = new Map(
        calendarData.map((d) => {
          const key = String(d?.date ?? "").slice(0, 10);
          return [key, d?.total_focus_minutes || 0];
        }),
      );
      const days = safeDatesInRange(from, to);
      return days.map((dateStr) => map.get(dateStr) ?? 0);
    } catch (e) {
      return new Array(7).fill(0);
    }
  }, [calendarData, from, to]);

  const weekDateLabels = useMemo(() => {
    const days = safeDatesInRange(from, to);
    return days.map((dateStr) => {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      });
    });
  }, [from, to]);

  const safeWeeklyMinutes =
    Array.isArray(weeklyMinutes) && weeklyMinutes.length === 7
      ? weeklyMinutes
      : new Array(7).fill(0);

  const maxMinutes = safeWeeklyMinutes.length ? Math.max(...safeWeeklyMinutes) : 0;
  const weekFocusedMinutes = safeWeeklyMinutes.length
    ? safeWeeklyMinutes.reduce((s, m) => s + m, 0)
    : 0;
  const useHours = maxMinutes >= 60;

  const todayIndex = useMemo(() => {
    if (weekOffset !== 0) return -1;
    if (!from || !to || !user) return -1;
    try {
      const todayKey = todayYmdInTz(user?.time_zone);
      const arr = safeDatesInRange(from, to);
      const idx = arr.indexOf(todayKey);
      return idx >= 0 ? idx : -1;
    } catch {
      return -1;
    }
  }, [weekOffset, from, to, user?.time_zone, user]);

  const chartData = safeWeeklyMinutes.map((m) =>
    useHours ? parseFloat(((m / 60) || 0).toFixed(2)) : m || 0
  );

  const colorMap = {
    type: "ordinal",
    colors: xLabels.map((_, i) => (i === todayIndex ? ACCENT : BASE)),
  };

  const allTimeDisplay = allTimeLoading ? "…" : formatMinutes(allTimeMinutes);

  const xAxisValueFormatter = useMemo(
    () => (value, context) => {
      if (context.location === "tick") return value;
      const idx = xLabels.indexOf(value);
      return weekDateLabels[idx] ?? value;
    },
    [weekDateLabels],
  );

  const seriesValueFormatter = useMemo(
    () => (_value, context) => formatMinutes(safeWeeklyMinutes[context.dataIndex] ?? 0),
    [safeWeeklyMinutes],
  );

  const chartHeight = useMemo(() => {
    if (viewport.isLandscapePhone) {
      return Math.max(160, viewport.height - 220);
    }
    if (viewport.isMobile) {
      return 220;
    }
    return 300;
  }, [viewport]);

  const chartMargin = useMemo(
    () => ({
      left: viewport.isMobile ? 28 : 46,
      right: 4,
      top: 12,
      bottom: viewport.isMobile ? 24 : 32,
    }),
    [viewport.isMobile],
  );

  const summaryLandscapeLayout =
    tab === "summary" && viewport.isLandscapePhone;

  const isAtCreationWeek = useMemo(() => {
    if (!user?.created_at) return false;
    const { from: weekFrom } = getWeekRange(weekOffset, user?.time_zone);
    const weekStart = weekFrom ? new Date(weekFrom) : null;
    const createdAt = new Date(user.created_at);
    const createdSunday = new Date(createdAt);
    createdSunday.setDate(createdAt.getDate() - createdAt.getDay());
    createdSunday.setHours(0, 0, 0, 0);
    if (!weekStart || isNaN(weekStart.getTime())) return false;
    return weekStart <= createdSunday;
  }, [user?.created_at, weekOffset, user?.time_zone]);

  if (!openSettings) return null;

  const contentClass =
    "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain";

  const renderWeeklyChart = (className = "") => (
    <Box
      className={className}
      sx={{
        width: "100%",
        maxWidth: "100%",
        height: chartHeight,
        minHeight: 160,
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <BarChart
        margin={chartMargin}
        series={[
          {
            data: chartData,
            label: useHours ? "Hours studied" : "Minutes studied",
            id: "study",
            valueFormatter: seriesValueFormatter,
          },
        ]}
        xAxis={[
          {
            data: xLabels,
            colorMap,
            tickLabelStyle: {
              fontSize: viewport.isMobile ? 10 : 12,
            },
            valueFormatter: xAxisValueFormatter,
          },
        ]}
        yAxis={[
          {
            width: viewport.isMobile ? 28 : 46,
            tickMinStep: useHours ? 0.5 : 1,
            tickLabelStyle: {
              fontSize: viewport.isMobile ? 10 : 12,
            },
            valueFormatter: (v) => (useHours ? `${v}h` : `${v}m`),
          },
        ]}
      />
    </Box>
  );

  return (
    <div className="absolute inset-0 z-50 overflow-x-hidden bg-black/30">
      <div className="absolute left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-md bg-white p-3 sm:max-h-[90dvh] sm:w-[min(92vw,36rem)] sm:p-5 landscape:max-h-[96dvh] landscape:p-3">
        <div className="flex shrink-0 items-center justify-between gap-2">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              width={40}
              height={40}
              className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-10 sm:w-10"
              src={user.avatar}
              alt={user.name}
            />
          ) : (
            <span className="w-9 shrink-0" aria-hidden />
          )}
          <h1 className="min-w-0 flex-1 truncate text-center text-sm font-bold uppercase tracking-wider text-gray-800 sm:text-base">
            {user?.name || "User"}&apos;s Statistics
          </h1>
          <button
            type="button"
            aria-label="Close statistics"
            onClick={() => setOpenSettings(false)}
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <FiX size={22} />
          </button>
        </div>

        <div className="mt-3 flex shrink-0 gap-1 rounded-lg bg-gray-100 p-1 sm:mt-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 rounded-md transition-colors sm:gap-1.5 sm:text-xs ${
                  tab === t.id
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={14} strokeWidth={2.25} aria-hidden />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="my-3 h-px w-full shrink-0 bg-gray-200 sm:my-5" />

        <div className={contentClass}>
        {tab === "summary" && (
          <>
            {summaryLandscapeLayout ? (
              <div className="flex min-h-0 flex-1 gap-3">
                <div className="flex w-[9.5rem] shrink-0 flex-col gap-2 sm:w-[10.5rem]">
                  <div className="grid grid-cols-1 gap-2">
                    <StatCard icon={Flame} value={streak} label="day streak" styles={STYLES[status]} />
                    <StatCard icon={Trophy} value={longestStreak} label="longest streak" styles="text-yellow-500 fill-yellow-500" />
                    <StatCard icon={Clock} value={allTimeDisplay} label="all time" compactValue />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 px-1 py-1">
                    <button
                      onClick={() => setWeekOffset((w) => w - 1)}
                      className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40"
                      disabled={isAtCreationWeek}
                      aria-label="Previous week"
                    >
                      <GrFormPreviousLink />
                    </button>
                    <span className="text-[10px] text-gray-600">
                      {weekOffset === 0 ? "This Week" : `${Math.abs(weekOffset)}w ago`}
                    </span>
                    <button
                      disabled={weekOffset === 0}
                      onClick={() => setWeekOffset((w) => w + 1)}
                      className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-40"
                      aria-label="Next week"
                    >
                      <GrFormNextLink />
                    </button>
                  </div>
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <h2 className="mb-2 text-sm font-semibold text-gray-600">Study Hours (Weekly)</h2>
                  {renderWeeklyChart("min-h-0 flex-1")}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <StatCard icon={Flame} value={streak} label="day streak" styles={STYLES[status]} />
                  <StatCard icon={Trophy} value={longestStreak} label="longest streak" styles="text-yellow-500 fill-yellow-500" />
                  <StatCard icon={Clock} value={allTimeDisplay} label="all time" compactValue />
                </div>

                <div className="my-4 sm:my-6">
                  <h2 className="text-base font-semibold text-gray-600 mb-2 sm:text-lg">Study Hours (Weekly)</h2>
                  <div className="h-px w-full bg-gray-300" />
                </div>

                <div className="mb-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setWeekOffset((w) => w - 1)}
                    className="rounded border px-2 py-1 hover:bg-gray-100 disabled:opacity-40 sm:px-3"
                    disabled={isAtCreationWeek}
                    aria-label="Previous week"
                  >
                    <GrFormPreviousLink />
                  </button>
                  <span className="text-xs text-gray-600 sm:text-sm">
                    {weekOffset === 0 ? "This Week" : `${Math.abs(weekOffset)} week(s) ago`}
                  </span>
                  <button
                    disabled={weekOffset === 0}
                    onClick={() => setWeekOffset((w) => w + 1)}
                    className="rounded border px-2 py-1 hover:bg-gray-100 disabled:opacity-40 sm:px-3"
                    aria-label="Next week"
                  >
                    <GrFormNextLink />
                  </button>
                </div>

                <div className="min-w-0 w-full">
                  {renderWeeklyChart()}
                </div>
              </>
            )}

            {loading && <p className="text-sm text-gray-400 mt-2">Loading analytics…</p>}
            {error && (
              <p className="text-sm text-red-500 mt-2">
                Failed to load analytics{" "}
                <button type="button" className="underline" onClick={() => refetchWeek()}>
                  Retry
                </button>
              </p>
            )}
            {!loading && !error && weekFocusedMinutes === 0 && weekOffset === 0 && (
              <p className="text-sm text-gray-400 mt-2">
                No focus logged this week yet — finish a pomodoro while signed in.
              </p>
            )}
          </>
        )}

        {tab === "sessions" && (
          <div className="min-w-0">
            {namedSessions.length === 0 ? (
              <p className="text-sm text-gray-400 mt-4 text-center">
                No named sessions yet — name a pomodoro before you start.
              </p>
            ) : viewport.isMobile ? (
              <ul className="mt-1 space-y-2">
                {namedSessions.map((row) => (
                  <li
                    key={row.session_name_hash}
                    className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5"
                  >
                    <p className="truncate text-sm font-medium text-gray-700">
                      {row.session_name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                      <span className="tabular-nums">{row.total_minutes} min</span>
                      <span className="tabular-nums">{formatShortDate(row.date)}</span>
                      <span className="tabular-nums">
                        {row.session_count} session{row.session_count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <table className="w-full table-fixed text-xs mt-1">
                <thead>
                  <tr className="text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-200">
                    <th className="w-[44%] text-left font-medium pb-2 pr-2">Name</th>
                    <th className="w-[18%] text-right font-medium pb-2 px-1">Min</th>
                    <th className="w-[22%] text-right font-medium pb-2 px-1">Date</th>
                    <th className="w-[16%] text-right font-medium pb-2 pl-1">#</th>
                  </tr>
                </thead>
                <tbody>
                  {namedSessions.map((row) => (
                    <tr
                      key={row.session_name_hash}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-2.5 pr-2 text-gray-700 truncate">
                        {row.session_name}
                      </td>
                      <td className="py-2.5 px-1 text-right tabular-nums text-gray-600">
                        {row.total_minutes}
                      </td>
                      <td className="py-2.5 px-1 text-right tabular-nums text-gray-500">
                        {formatShortDate(row.date)}
                      </td>
                      <td className="py-2.5 pl-1 text-right tabular-nums text-gray-500">
                        {row.session_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === "leaderboard" && (
          <div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-3">
              {LEADERBOARD_PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLeaderboardPeriod(p.id)}
                  className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                    leaderboardPeriod === p.id
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 mb-3">
              {leaderboardPeriod === "week" ? "Last 7 Days" : "All Time"} · Top 5
            </p>
            {hiddenFromLeaderboard && (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                You&apos;re hidden from this board. Turn on{" "}
                <span className="font-semibold">Appear on leaderboard</span> in
                Settings → Privacy to join.
              </p>
            )}
            {globalLoading && (
              <p className="text-sm text-gray-400">Loading…</p>
            )}
            {globalError && !globalLoading && (
              <p className="text-sm text-red-500 text-center py-6">
                Couldn&apos;t load leaderboard.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => refetchGlobal()}
                >
                  Retry
                </button>
              </p>
            )}
            {!globalLoading && !globalError && globalBoard.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                No focus logged yet.
              </p>
            )}
            {!globalError &&
              globalBoard.map((entry) => {
              const isSelf = entry.user_id === user?.id;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 ${
                    isSelf ? "bg-indigo-50/60 -mx-2 px-2 rounded-md" : ""
                  }`}
                >
                  <span className="w-6 text-center text-sm shrink-0">
                    {MEDAL[entry.rank] ?? (
                      <span className="text-gray-400 text-xs">{entry.rank}</span>
                    )}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 overflow-hidden shrink-0">
                    {entry.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.avatar_url}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      entry.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  {entry.username ? (
                    <Link
                      href={`/${entry.username}`}
                      onClick={() => setOpenSettings(false)}
                      className="flex-1 truncate text-sm text-gray-700 hover:text-indigo-600 hover:underline"
                    >
                      {entry.name}
                      {isSelf ? (
                        <span className="text-indigo-400 text-[10px] ml-1.5 no-underline">you</span>
                      ) : null}
                    </Link>
                  ) : (
                    <span className="flex-1 truncate text-sm text-gray-700">
                      {entry.name}
                      {isSelf ? (
                        <span className="text-indigo-400 text-[10px] ml-1.5">you</span>
                      ) : null}
                    </span>
                  )}
                  <span className="text-xs tabular-nums text-gray-500 shrink-0">
                    {formatMinutes(entry.focus_minutes)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(ModelStatistics);
