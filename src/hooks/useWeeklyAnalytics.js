"use client";

import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";
import {
  isPastWeek,
  readWeekAnalyticsCache,
  writeWeekAnalyticsCache,
} from "@/lib/analyticsWeekCache";

async function fetchWeekCalendar(from, to) {
  const res = await axiosClient.get("/analytics/calendar", { params: { from, to } });
  return res.data;
}

export function useWeeklyAnalytics(from, to, weekOffset, options = {}) {
  const enabled = (options.enabled ?? true) && !!from && !!to;
  const past = isPastWeek(weekOffset);

  return useQuery({
    queryKey: ["analytics", "calendar", from, to],
    queryFn: async () => {
      const data = await fetchWeekCalendar(from, to);
      if (past && Array.isArray(data)) {
        const hasFocus = data.some((d) => (d?.total_focus_minutes ?? 0) > 0);
        if (hasFocus) writeWeekAnalyticsCache(from, to, data);
      }
      return data;
    },
    enabled,
    staleTime: past ? Infinity : 15 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: weekOffset === 0,
    gcTime: 24 * 60 * 60 * 1000,
    initialData: () => (past ? readWeekAnalyticsCache(from, to) : undefined),
    initialDataUpdatedAt: past ? 0 : undefined,
  });
}
