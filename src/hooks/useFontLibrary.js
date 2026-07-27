import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/utils/axios";
import { resolveFontFaceUrl } from "@/lib/fontUrl";

/** Active custom fonts for the space editor dropdown. */
export function useFontLibrary(enabled = true) {
  return useQuery({
    queryKey: ["fonts", "library"],
    queryFn: async () => {
      const { data } = await axiosClient.get("/fonts/library");
      const rows = Array.isArray(data) ? data : [];
      // Normalize to absolute same-origin URLs for @font-face.
      return rows.map((font) => ({
        ...font,
        url: resolveFontFaceUrl(font.url, font.id),
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
