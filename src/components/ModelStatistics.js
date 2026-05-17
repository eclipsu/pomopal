"use client";

import React, { useState, useMemo, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { GrFormPreviousLink, GrFormNextLink } from "react-icons/gr";
import Image from "next/image";
import Box from "@mui/material/Box";
import { BarChart } from "@mui/x-charts/BarChart";
import { Clock, Flame, Trophy } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useStreak } from "@/hooks/useStreak";
import { useWeeklyAnalytics } from "@/hooks/useWeeklyAnalytics";
import { useAllTimeFocus } from "@/hooks/useAllTimeFocus";
import { getWeekRange, datesInRange, todayYmdInTz } from "@/lib/weekDates";
import { STYLES } from "@/components/StreakIndicator";

const ACCENT = "#6366f1";
const BASE = "#cbd5e1";

const StatCard = ({ icon: Icon, value, label, styles = null }) => (
  <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center aspect-square w-30 border border-gray-200">
    <Icon className={`text-gray-400 mb-1 ${styles ?? ""}`} size={24} strokeWidth={2} />
    <div className="text-gray-800 text-3xl font-bold mb-0.5">{value}</div>
    <div className="text-gray-500 text-xs">{label}</div>
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


function ModelStatistics({ setOpenSettings, openSettings }) {
  const { user } = useUser();
  const [weekOffset, setWeekOffset] = useState(0);
  const xLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

  useEffect(() => {
    if (openSettings) {
      refetchWeek();
      refetchAllTime();
    }
  }, [openSettings, from, to, refetchWeek, refetchAllTime]);

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

  return (
    <div className="absolute inset-0 bg-black bg-opacity-30">
      <div
        className="p-5 rounded-md max-w-xl bg-white absolute sm:w-86 w-11/12 left-1/2 top-1/2"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div className="text-gray-400 flex justify-between items-center">
          {user?.avatar && (
            <Image
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              src={user.avatar}
              alt={user.name}
            />
          )}
          <h1 className="uppercase font-bold tracking-wider text-gray-800">
            {user?.name || "User"}'s Statistics
          </h1>
          <FiX
            className="text-2xl cursor-pointer text-gray-600"
            onClick={() => setOpenSettings(false)}
          />
        </div>

        <div className="h-px w-full bg-gray-200 my-5" />

        <div className="flex gap-4">
          <StatCard icon={Flame} value={streak} label="day streak" styles={STYLES[status]} />
          <StatCard icon={Trophy} value={longestStreak} label="longest streak" styles={"text-yellow-500 fill-yellow-500 drop-shadow-[0_0_6px_rgba(250,204,21,0.55)]"} />
          <StatCard icon={Clock} value={allTimeDisplay} label="all time" />
        </div>

        <div className="my-6">
          <h2 className="text-gray-600 text-lg font-semibold mb-2">Study Hours (Weekly)</h2>
          <div className="h-px w-full bg-gray-300"></div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-40"
            disabled={isAtCreationWeek}
          >
            <GrFormPreviousLink />
          </button>
          <span className="text-sm text-gray-600">
            {weekOffset === 0 ? "This Week" : `${Math.abs(weekOffset)} week(s) ago`}
          </span>
          <button
            disabled={weekOffset === 0}
            onClick={() => setWeekOffset((w) => w + 1)}
            className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-40"
          >
            <GrFormNextLink />
          </button>
        </div>

        <Box sx={{ width: "100%", height: 300, position: "relative" }}>
          <BarChart
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
                valueFormatter: xAxisValueFormatter,
              },
            ]}
            yAxis={[
              {
                width: 50,
                tickMinStep: useHours ? 0.5 : 1,
                valueFormatter: (v) => (useHours ? `${v}h` : `${v}m`),
              },
            ]}
          />
        </Box>

        {loading && <p className="text-sm text-gray-400 mt-2">Loading analytics…</p>}
        {error && (
          <p className="text-sm text-red-500 mt-2">
            Failed to load analytics
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
      </div>
    </div>
  );
}

export default React.memo(ModelStatistics);