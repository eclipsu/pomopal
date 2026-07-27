import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";
import { getUploadApiBaseUrl } from "@/utils/apiBase";

const SOUNDS_KEY = ["admin", "sounds"];

/** Must stay in sync with backend SOUND_MAX_AUDIO_BYTES default (500 MB). */
export const MAX_AUDIO_UPLOAD_BYTES = 500 * 1024 * 1024;

function guessAudioMime(file) {
  if (file?.type && file.type.startsWith("audio/")) return file.type;
  const name = String(file?.name || "").toLowerCase();
  if (name.endsWith(".m4a")) return "audio/mp4";
  if (name.endsWith(".aac")) return "audio/aac";
  if (name.endsWith(".wav")) return "audio/wav";
  if (name.endsWith(".ogg")) return "audio/ogg";
  if (name.endsWith(".webm")) return "audio/webm";
  return "audio/mpeg";
}

function uploadErrorMessage(err) {
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  if (typeof msg === "string") return msg;
  if (err?.code === "ERR_NETWORK") {
    return "Network error during upload — check connection and try again";
  }
  return err?.message || "Upload failed";
}

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
      if (!file) throw new Error("Audio file is required");
      if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
        throw new Error(
          `Audio must be ${Math.round(MAX_AUDIO_UPLOAD_BYTES / (1024 * 1024))} MB or smaller (your file is ${Math.round(file.size / (1024 * 1024))} MB)`,
        );
      }

      const mimetype = guessAudioMime(file);
      let directError = null;

      // Prefer direct-to-S3 (fast, no Nest memory pressure).
      try {
        const { data: target } = await axiosClient.post(
          "/admin/sounds/upload-url",
          { type, mimetype },
          { baseURL: getUploadApiBaseUrl() },
        );

        await axios.put(target.uploadUrl, file, {
          headers: { "Content-Type": mimetype },
          onUploadProgress,
          timeout: 0,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        const { data } = await axiosClient.post(
          "/admin/sounds/complete-upload",
          {
            key: target.key,
            type,
            name,
          },
          { baseURL: getUploadApiBaseUrl() },
        );
        return data;
      } catch (err) {
        directError = err;
      }

      // Fallback: stream through Nest (disk → S3). Works without S3 browser CORS.
      try {
        const fd = new FormData();
        fd.append("audio", file);
        fd.append("type", type);
        if (name?.trim()) fd.append("name", name.trim());
        const { data } = await axiosClient.post("/admin/sounds/upload", fd, {
          baseURL: getUploadApiBaseUrl(),
          onUploadProgress,
          timeout: 0,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });
        return data;
      } catch (fallbackErr) {
        throw new Error(
          uploadErrorMessage(fallbackErr) ||
            uploadErrorMessage(directError) ||
            "Upload failed",
        );
      }
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

export function useCreateYoutubeSound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ url, name, type }) => {
      const { data } = await axiosClient.post("/admin/sounds/from-youtube", {
        url,
        name,
        type,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOUNDS_KEY });
      queryClient.invalidateQueries({ queryKey: ["sounds", "library"] });
    },
  });
}
