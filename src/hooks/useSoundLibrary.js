import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

export function useSoundLibrary(type, enabled = true) {
  return useQuery({
    queryKey: ["sounds", "library", type],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/sounds/library?type=${type}`);
      return data;
    },
    enabled: Boolean(type) && enabled,
    staleTime: 5 * 60 * 1000,
  });
}
