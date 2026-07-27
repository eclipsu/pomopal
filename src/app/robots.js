import { appBaseUrl } from "@/lib/seo";

export default function robots() {
  const base = appBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: ["/admin", "/api/", "/login", "/register"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
