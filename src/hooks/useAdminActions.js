import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useStreakPauses() {
  return useQuery({
    queryKey: ["admin", "streak-pauses"],
    queryFn: async () => {
      const { data } = await axiosClient.get("/admin/streak-pauses");
      return data;
    },
    // 404 = backend without streak pauses; don't keep retrying.
    retry: (count, error) => error?.response?.status !== 404 && count < 3,
  });
}

export function useAddStreakPause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post("/admin/streak-pauses", payload);
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "streak-pauses"] }),
  });
}

export function useRemoveStreakPause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosClient.delete(`/admin/streak-pauses/${id}`);
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "streak-pauses"] }),
  });
}
