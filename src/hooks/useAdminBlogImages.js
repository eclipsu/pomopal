import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";

const BLOG_IMAGES_KEY = ["admin", "blog-images"];

export function useAdminBlogImages(enabled = true) {
  return useQuery({
    queryKey: BLOG_IMAGES_KEY,
    queryFn: async () => {
      const { data } = await axiosClient.get("/admin/blog-images");
      return data;
    },
    enabled,
  });
}

export function useUploadBlogImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, name }) => {
      const fd = new FormData();
      fd.append("image", file);
      if (name?.trim()) fd.append("name", name.trim());
      const { data } = await axiosClient.post("/admin/blog-images/upload", fd);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOG_IMAGES_KEY });
    },
  });
}

export function useDeleteBlogImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key) => {
      const { data } = await axiosClient.delete("/admin/blog-images", {
        params: { key },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOG_IMAGES_KEY });
    },
  });
}
