"use client";

import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

async function fetchSessionNameBreakdown() {
  const res = await axiosClient.get("/analytics/session-names", {
    params: { limit: 20 },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export function useSessionNameBreakdown(options = {}) {
  const enabled = options.enabled ?? true;

  return useQuery({
    queryKey: ["analytics", "session-names"],
    queryFn: fetchSessionNameBreakdown,
    enabled,
    staleTime: 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
