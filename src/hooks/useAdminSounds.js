import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";
import { getUploadApiBaseUrl } from "@/utils/apiBase";

const SOUNDS_KEY = ["admin", "sounds"];

export function useAdminSounds(type, enabled = true) {
  return useQuery({
    queryKey: [...SOUNDS_KEY, type || "all"],
    queryFn: async () => {
      const suffix = type ? `?type=${type}` : "";
      const { data } = await axiosClient.get(`/admin/sounds${suffix}`);
      return data;
    },
    enabled,
  });
}

export function useUploadSound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, name, type, onUploadProgress }) => {
      const mimetype = file?.type || "audio/mpeg";

      try {
        const { data: target } = await axiosClient.post(
          "/admin/sounds/upload-url",
          { type, mimetype },
          {
            baseURL: getUploadApiBaseUrl(),
          },
        );

        await axios.put(target.uploadUrl, file, {
          headers: {
            "Content-Type": mimetype,
          },
          onUploadProgress,
        });

        const { data } = await axiosClient.post(
          "/admin/sounds/complete-upload",
          {
            key: target.key,
            type,
            name,
          },
          {
            baseURL: getUploadApiBaseUrl(),
          },
        );
        return data;
      } catch (_directUploadError) {
        // Fallback when direct-to-S3 upload is unavailable (e.g. missing S3 CORS).
      }

      const fd = new FormData();
      fd.append("audio", file);
      fd.append("type", type);
      if (name?.trim()) fd.append("name", name.trim());
      const { data } = await axiosClient.post("/admin/sounds/upload", fd, {
        baseURL: getUploadApiBaseUrl(),
        onUploadProgress,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOUNDS_KEY });
      queryClient.invalidateQueries({ queryKey: ["sounds", "library"] });
    },
  });
}

export function useUpdateSound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await axiosClient.patch(`/admin/sounds/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOUNDS_KEY });
      queryClient.invalidateQueries({ queryKey: ["sounds", "library"] });
    },
  });
}

export function useDeleteSound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await axiosClient.delete(`/admin/sounds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOUNDS_KEY });
      queryClient.invalidateQueries({ queryKey: ["sounds", "library"] });
    },
  });
}
