"use client";

import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

async function fetchGlobalLeaderboard() {
  const res = await axiosClient.get("/leaderboard/global/alltime");
  return Array.isArray(res.data) ? res.data : [];
}

export function useGlobalLeaderboard(options = {}) {
  const enabled = options.enabled ?? true;

  return useQuery({
    queryKey: ["leaderboard", "global", "alltime"],
    queryFn: fetchGlobalLeaderboard,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
