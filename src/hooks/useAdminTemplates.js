import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

const TEMPLATES_KEY = ["admin", "notification-templates"];

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

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await axiosClient.post(
        "/admin/notification-templates",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const { data } = await axiosClient.patch(
        `/admin/notification-templates/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await axiosClient.delete(`/admin/notification-templates/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
}
