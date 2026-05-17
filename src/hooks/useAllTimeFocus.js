"use client";

import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

async function fetchAllTimeFocus() {
  const res = await axiosClient.get("/analytics/all-time");
  return res.data?.total_focus_minutes ?? 0;
}

export function useAllTimeFocus(options = {}) {
  const enabled = options.enabled ?? true;

  return useQuery({
    queryKey: ["analytics", "all-time"],
    queryFn: fetchAllTimeFocus,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
