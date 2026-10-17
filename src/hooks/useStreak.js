"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    lastActiveDate: query.data?.last_active_date ?? null,
    graceDaysRemaining: query.data?.grace_days_remaining ?? null,
    freezes: query.data?.freezes ?? 0,
    maxFreezes: query.data?.max_freezes ?? 2,
    freezeProgress: query.data?.freeze_progress ?? 0,
    freezeEarnEvery: query.data?.freeze_earn_every ?? 5,
    freezesPending: query.data?.freezes_pending ?? 0,
    pausedToday: query.data?.paused_today ?? false,
    repair: query.data?.repair ?? null,
    /** Older backends don't have freezes/repair; hide that UI. */
    protectionSupported: query.data?.max_freezes != null,
    status,
  };
}

export function useRepairStreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await axiosClient.post("/streaks/repair")).data,
    onSuccess: (data) => queryClient.setQueryData(["streak"], data),
  });
}
