import {
  fetchSpaceByUsernameAndSlug,
  spaceShareMetadata,
} from "@/lib/seo";

export async function generateMetadata({ params }) {
  const resolved = typeof params?.then === "function" ? await params : params;
  const username = resolved?.username;
  const spaceSlug = resolved?.spaceSlug;
  if (!username || !spaceSlug) {
    return { title: "Space · Pomopal" };
  }

  try {
    const { ok, space } = await fetchSpaceByUsernameAndSlug(
      username,
      spaceSlug,
    );
    if (!ok || !space) {
      return { title: "Space · Pomopal", robots: { index: false } };
    }
    return spaceShareMetadata(space, `/${username}/${spaceSlug}`);
  } catch {
    return { title: "Space · Pomopal" };
  }
}

export default function UserSpaceLayout({ children }) {
  return children;
}
