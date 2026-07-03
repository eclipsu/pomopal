import { useMutation, useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

export function useUserStreakStatus(userId) {
  return useQuery({
    queryKey: ["admin", "streak-status", userId],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/admin/users/${userId}/streak-status`);
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 10_000,
  });
}

export function useReviveStreak() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post("/admin/revive-streak", payload);
      return data;
    },
  });
}

export function useBroadcastAnnouncement() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post("/admin/announcement", payload);
      return data;
    },
  });
}

export function usePreviewNotification() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post("/admin/preview-notification", payload);
      return data;
    },
  });
}
