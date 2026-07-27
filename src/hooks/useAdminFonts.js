import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";
import { getUploadApiBaseUrl } from "@/utils/apiBase";

const FONTS_KEY = ["admin", "fonts"];

/** Must stay in sync with backend FONT_MAX_BYTES default (10 MB). */
export const MAX_FONT_UPLOAD_BYTES = 10 * 1024 * 1024;

function guessFontMime(file) {
  if (file?.type && /font|ttf|sfnt|octet/i.test(file.type)) return file.type;
  return "font/ttf";
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

export function useAdminFonts(enabled = true) {
  return useQuery({
    queryKey: FONTS_KEY,
    queryFn: async () => {
      const { data } = await axiosClient.get("/admin/fonts");
      return data;
    },
    enabled,
  });
}

export function useUploadFont() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, name, onUploadProgress }) => {
      if (!file) throw new Error("Font file is required");
      if (file.size > MAX_FONT_UPLOAD_BYTES) {
        throw new Error(
          `Font must be ${Math.round(MAX_FONT_UPLOAD_BYTES / (1024 * 1024))} MB or smaller`,
        );
      }

      const mimetype = guessFontMime(file);
      let directError = null;

      try {
        const { data: target } = await axiosClient.post(
          "/admin/fonts/upload-url",
          { mimetype },
          { baseURL: getUploadApiBaseUrl() },
        );

        await axios.put(target.uploadUrl, file, {
          headers: { "Content-Type": "font/ttf" },
          onUploadProgress,
          timeout: 0,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        const { data } = await axiosClient.post(
          "/admin/fonts/complete-upload",
          { key: target.key, name },
          { baseURL: getUploadApiBaseUrl() },
        );
        return data;
      } catch (err) {
        directError = err;
      }

      try {
        const fd = new FormData();
        fd.append("font", file);
        if (name?.trim()) fd.append("name", name.trim());
        const { data } = await axiosClient.post("/admin/fonts/upload", fd, {
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
      queryClient.invalidateQueries({ queryKey: FONTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["fonts", "library"] });
    },
  });
}

export function useUpdateFont() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await axiosClient.patch(`/admin/fonts/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FONTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["fonts", "library"] });
    },
  });
}

export function useDeleteFont() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await axiosClient.delete(`/admin/fonts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FONTS_KEY });
      queryClient.invalidateQueries({ queryKey: ["fonts", "library"] });
    },
  });
}
