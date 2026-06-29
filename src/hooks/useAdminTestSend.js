import { useMutation, useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

export function useAdminUsers(search, enabled = true) {
  return useQuery({
    queryKey: ["admin", "users", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search?.trim()) params.set("q", search.trim());
      params.set("limit", "50");
      const { data } = await axiosClient.get(`/admin/users?${params}`);
      return data;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useTestSendNotification() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post("/admin/test-send", payload);
      return data;
    },
  });
}
