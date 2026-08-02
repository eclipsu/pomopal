"use client";

import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

async function fetchPrivacy() {
  const res = await axiosClient.get("/privacy");
  return res.data;
}

export function usePrivacy(options = {}) {
  const enabled = options.enabled ?? true;
  return useQuery({
    queryKey: ["privacy"],
    queryFn: fetchPrivacy,
    enabled,
    staleTime: 60 * 1000,
  });
}
