"use client";

import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";
import { useUser } from "@/hooks/useUser";
import { deriveStreakStatus } from "@/lib/streakStatus";

async function fetchStreak() {
  const res = await axiosClient.get("/streaks");
  return res.data;
}

export function useStreak(options = {}) {
  const { user } = useUser();
  const enabled = (options.enabled ?? true) && !!user;

  const query = useQuery({
    queryKey: ["streak"],
    queryFn: fetchStreak,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const status = deriveStreakStatus(query.data);

  return {
    ...query,
    streak: query.data?.current_streak ?? 0,
    longestStreak: query.data?.longest_streak ?? 0,
    status,
  };
}
