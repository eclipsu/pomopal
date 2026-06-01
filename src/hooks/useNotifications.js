"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";
import { useUser } from "@/hooks/useUser";

export function useNotifications(options = {}) {
  const { user } = useUser();
  const enabled = (options.enabled ?? true) && !!user;
  const queryClient = useQueryClient();

  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const { data } = await axiosClient.get("/notifications/unread-count");
      return data.count ?? 0;
    },
    enabled,
    refetchInterval: 60_000,
  });

  const listQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const { data } = await axiosClient.get("/notifications");
      return data;
    },
    enabled,
  });

  const markRead = useMutation({
    mutationFn: (id) => axiosClient.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => axiosClient.patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    unreadCount: unreadQuery.data ?? 0,
    notifications: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    refetch: listQuery.refetch,
  };
}

export function useNotificationPreferences() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: async () => {
      const { data } = await axiosClient.get("/notifications/preferences");
      return data;
    },
    enabled: !!user,
  });

  const update = useMutation({
    mutationFn: (patch) => axiosClient.patch("/notifications/preferences", patch),
    onSuccess: (res) => {
      queryClient.setQueryData(["notifications", "preferences"], res.data);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    updatePreference: (key, value) => update.mutate({ [key]: value }),
    saving: update.isPending,
  };
}
