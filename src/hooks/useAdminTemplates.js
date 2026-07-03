import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

const TEMPLATES_KEY = ["admin", "notification-templates"];
const TEMPLATE_IMAGES_KEY = ["admin", "notification-template-images"];

export function useAdminTemplates(enabled = true) {
  return useQuery({
    queryKey: TEMPLATES_KEY,
    queryFn: async () => {
      const { data } = await axiosClient.get("/admin/notification-templates");
      return data;
    },
    enabled,
  });
}

export function useAdminTemplateImages(enabled = true) {
  return useQuery({
    queryKey: TEMPLATE_IMAGES_KEY,
    queryFn: async () => {
      const { data } = await axiosClient.get("/admin/notification-templates/images");
      return data;
    },
    enabled,
  });
}

export function useUploadTemplateImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, name }) => {
      const fd = new FormData();
      fd.append("image", file);
      if (name?.trim()) fd.append("name", name.trim());
      const { data } = await axiosClient.post(
        "/admin/notification-templates/upload-image",
        fd,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_IMAGES_KEY });
    },
  });
}

export function useRenameTemplateImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, name }) => {
      const { data } = await axiosClient.patch(
        "/admin/notification-templates/images/rename",
        { key, name },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_IMAGES_KEY });
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosClient.post("/admin/notification-templates", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      queryClient.invalidateQueries({ queryKey: TEMPLATE_IMAGES_KEY });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await axiosClient.patch(
        `/admin/notification-templates/${id}`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      queryClient.invalidateQueries({ queryKey: TEMPLATE_IMAGES_KEY });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await axiosClient.delete(`/admin/notification-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      queryClient.invalidateQueries({ queryKey: TEMPLATE_IMAGES_KEY });
    },
  });
}
