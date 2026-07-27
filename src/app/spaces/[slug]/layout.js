import {
  fetchSpaceBySlug,
  spaceShareMetadata,
} from "@/lib/seo";

export async function generateMetadata({ params }) {
  const resolved = typeof params?.then === "function" ? await params : params;
  const slug = resolved?.slug;
  if (!slug) {
    return { title: "Space · Pomopal" };
  }

  try {
    const { ok, space } = await fetchSpaceBySlug(slug);
    if (!ok || !space) {
      return { title: "Space · Pomopal", robots: { index: false } };
    }
    const path =
      space.path ||
      (space.creator?.username
        ? `/${space.creator.username}/${space.slug}`
        : `/spaces/${space.slug}`);
    return spaceShareMetadata(space, path);
  } catch {
    return { title: "Space · Pomopal" };
  }
}

export default function SpaceSlugLayout({ children }) {
  return children;
}
