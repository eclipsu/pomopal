import { appBaseUrl, backendBaseUrl } from "@/lib/seo";

export default async function sitemap() {
  const base = appBaseUrl();

  const staticRoutes = ["", "/spaces", "/privacy", "/contact"].map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: new Date(),
  }));

  let spaceRoutes = [];
  let profileRoutes = [];

  try {
    const backend = backendBaseUrl();
    const [spacesRes, profilesRes] = await Promise.all([
      fetch(`${backend}/spaces/sitemap`, { next: { revalidate: 300 } }),
      fetch(`${backend}/profiles/sitemap`, { next: { revalidate: 300 } }),
    ]);

    if (spacesRes.ok) {
      const rows = await spacesRes.json();
      spaceRoutes = (rows || []).map((row) => ({
        url: `${base}${row.path || `/spaces/${row.slug}`}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));
    }

    if (profilesRes.ok) {
      const rows = await profilesRes.json();
      profileRoutes = (rows || []).map((row) => ({
        url: `${base}${row.path || `/${row.username}`}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
      }));
    }
  } catch {
    // still return static routes
  }

  return [...staticRoutes, ...profileRoutes, ...spaceRoutes];
}
