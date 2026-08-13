"use client";

import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

/** @typedef {'week' | 'alltime'} GlobalLeaderboardPeriod */

async function fetchGlobalLeaderboard(period) {
  const path =
    period === "week"
      ? "/leaderboard/global/week"
      : "/leaderboard/global/alltime";
  const res = await axiosClient.get(path);
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * @param {GlobalLeaderboardPeriod} period
 * @param {{ enabled?: boolean }} [options]
 */
export function useGlobalLeaderboard(period = "week", options = {}) {
  const enabled = options.enabled ?? true;

  return useQuery({
    queryKey: ["leaderboard", "global", period],
    queryFn: () => fetchGlobalLeaderboard(period),
    enabled,
    staleTime: period === "week" ? 5 * 60 * 1000 : 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
