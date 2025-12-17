"use client";

import React, { useEffect, useState, useMemo } from "react";
import { FiX } from "react-icons/fi";
import { GrFormPreviousLink, GrFormNextLink } from "react-icons/gr";
import { account } from "@/app/lib/appwrite";
import Image from "next/image";
import Box from "@mui/material/Box";
import { BarChart } from "@mui/x-charts/BarChart";
import { Clock, Flame } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";

const StatCard = ({ icon: Icon, value, label }) => (
  <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center aspect-square w-28 border border-gray-200">
    <Icon className="text-gray-400 mb-1" size={24} strokeWidth={1.5} />
    <div className="text-gray-800 text-3xl font-bold mb-0.5">{value}</div>
    <div className="text-gray-500 text-xs">{label}</div>
  </div>
);

function getDateForWeekOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset * 7);
  return date.toISOString();
}

function ModelSettings({ setOpenSettings, openSettings }) {
  const [user, setUser] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const xLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    async function loadUser() {
      const u = await account.get();
      setUser(u);
    }
    loadUser();
  }, []);

  const dateIso = useMemo(() => getDateForWeekOffset(weekOffset), [weekOffset]);

  const { data, loading, error } = useFetch(
    "/api/analytics",
    {},
    {
      enabled: !!user?.$id && openSettings,
      headers: {
        "x-user-id": user?.$id,
        "x-date": dateIso,
      },
    }
  );

  const streak = data?.streak ?? 0;
  const focusedHours = data?.focusedHours != null ? Math.floor(data.focusedHours / 60) : 0;
  const weeklyMinutes = data?.studyHours?.weekly ?? new Array(7).fill(0);
  const weeklyHours = weeklyMinutes.map((m) => +(m / 60).toFixed(2));

  if (!openSettings) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-30">
      <div
        className="p-5 rounded-md max-w-xl bg-white absolute sm:w-86 w-11/12 left-1/2 top-1/2"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div className="text-gray-400 flex justify-between items-center">
          {user?.prefs?.avatar && (
            <Image
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              src={user.prefs.avatar}
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
          <StatCard icon={Clock} value={focusedHours} label="hours focused" />
        </div>

        <div className="my-6">
          <h2 className="text-gray-600 text-lg font-semibold mb-2">Study Hours (Weekly)</h2>
          <div className="h-px w-full bg-gray-300"></div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="px-3 py-1 border rounded hover:bg-gray-100"
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
            series={[
              {
                data: weeklyHours,
                label: "Hours Studied",
                id: "study",
              },
            ]}
            xAxis={[{ data: xLabels }]}
            yAxis={[{ width: 50 }]}
          />
        </Box>

        {loading && <p className="text-sm text-gray-400 mt-2">Loading analytics…</p>}

        {error && <p className="text-sm text-red-500 mt-2">Failed to load analytics</p>}
      </div>
    </div>
  );
}

export default React.memo(ModelSettings);
