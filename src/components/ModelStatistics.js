"use client";

import React, { useState, useMemo } from "react";
import { FiX } from "react-icons/fi";
import { GrFormPreviousLink, GrFormNextLink } from "react-icons/gr";
import Image from "next/image";
import Box from "@mui/material/Box";
import { BarChart } from "@mui/x-charts/BarChart";
import { Clock, Flame, Trophy } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { useUser } from "@/hooks/useUser";

const StatCard = ({ icon: Icon, value, label }) => (
  <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center aspect-square w-30 border border-gray-200">
    <Icon className="text-gray-400 mb-1" size={24} strokeWidth={1.5} />
    <div className="text-gray-800 text-3xl font-bold mb-0.5">{value}</div>
    <div className="text-gray-500 text-xs">{label}</div>
  </div>
);

function getWeekRange(offset) {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay() + offset * 7);
  sunday.setHours(0, 0, 0, 0);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  return {
    from: sunday.toISOString().split("T")[0],
    to: saturday.toISOString().split("T")[0],
  };
}

function ModelStatistics({ setOpenSettings, openSettings }) {
  const { user } = useUser();
  console.log(user);
  const [weekOffset, setWeekOffset] = useState(0);
  const xLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const { from, to } = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  const { data: streakData } = useFetch("/streaks", {}, { enabled: openSettings });

  const {
    data: calendarData,
    loading,
    error,
  } = useFetch("/analytics/calendar", { from, to }, { enabled: openSettings });

  const streak = streakData?.current_streak ?? 0;
  const longestStreak = streakData?.longest_streak ?? 0;

  const weeklyMinutes = useMemo(() => {
    if (!calendarData || !Array.isArray(calendarData)) return new Array(7).fill(0);

    const { from } = getWeekRange(weekOffset);
    const map = new Map(calendarData.map((d) => [d.date, d.total_focus_minutes || 0]));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      return map.get(d.toISOString().split("T")[0]) ?? 0;
    });
  }, [calendarData, weekOffset]);

  const weeklyData = weeklyMinutes;

  const focusedMinutes = weeklyMinutes.reduce((s, m) => s + m, 0);
  const focusedDisplay =
    focusedMinutes >= 60 ? `${Math.floor(focusedMinutes / 60)}h` : `${focusedMinutes}m`;

  const isAtCreationWeek = useMemo(() => {
    if (!user?.created_at) return false;

    const { from } = getWeekRange(weekOffset);
    const weekStart = new Date(from);

    const createdAt = new Date(user.created_at);
    const createdSunday = new Date(createdAt);
    createdSunday.setDate(createdAt.getDate() - createdAt.getDay());
    createdSunday.setHours(0, 0, 0, 0);

    return weekStart <= createdSunday;
  }, [user?.created_at, weekOffset]);

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
          <StatCard icon={Flame} value={streak} label="day streak" />
          <StatCard icon={Trophy} value={longestStreak} label="longest streak" />
          <StatCard icon={Clock} value={focusedDisplay} label="time focused" />
        </div>

        <div className="my-6">
          <h2 className="text-gray-600 text-lg font-semibold mb-2">Study Hours (Weekly)</h2>
          <div className="h-px w-full bg-gray-300"></div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="px-3 py-1 border rounded hover:bg-gray-100"
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

        <Box sx={{ width: "100%", height: 300 }}>
          <BarChart
            series={[{ data: weeklyData, label: "Minutes Studied", id: "study" }]}
            xAxis={[{ data: xLabels }]}
            yAxis={[
              {
                width: 50,
                tickMinStep: 1,
                valueFormatter: (v) => `${v}m`,
              },
            ]}
          />
        </Box>

        {loading && <p className="text-sm text-gray-400 mt-2">Loading analytics…</p>}
        {error && <p className="text-sm text-red-500 mt-2">Failed to load analytics</p>}
      </div>
    </div>
  );
}

export default React.memo(ModelStatistics);
