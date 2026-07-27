"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getSpaceByUsernameAndSlug,
  layoutToAppearancePatch,
  applyLayoutSounds,
  applyBakedSpace,
  ensureSpaceFontFace,
  recordSpaceView,
  spacePath,
} from "@/app/services/spaces";
import { useSpaceStore } from "@/stores/useSpaceStore";
import { useSoundPreferences } from "@/hooks/useSoundPreferences";
import { toast } from "react-toastify";

/** Open /username/slug → apply to timer immediately, no preview. */
export default function UserSpacePage() {
  const params = useParams();
  const username = params?.username;
  const spaceSlug = params?.spaceSlug;
  const router = useRouter();
  const { updateBackground, updateRing } = useSoundPreferences();
  const applyAppearance = useSpaceStore((s) => s.applyAppearance);
  const setSpaceMeta = useSpaceStore((s) => s.setSpaceMeta);
  const setSidebarOpen = useSpaceStore((s) => s.setSidebarOpen);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (
      !username ||
      typeof username !== "string" ||
      !spaceSlug ||
      typeof spaceSlug !== "string"
    ) {
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const space = await getSpaceByUsernameAndSlug(username, spaceSlug);
        if (cancelled) return;

        const owned = Boolean(space.can_edit);
        if (space.baked?.layout) {
          const font = applyBakedSpace(space.baked, {
            applyAppearance,
            updateBackground,
            updateRing,
            title: space.title,
          });
          ensureSpaceFontFace(font);
        } else {
          applyAppearance(layoutToAppearancePatch(space.layout, space.title));
          applyLayoutSounds(space.layout, { updateBackground, updateRing });
        }
        setSpaceMeta({
          spaceId: owned ? space.id : null,
          spaceSlug: space.slug,
          spacePath: spacePath(space),
          spaceVisibility: space.visibility,
          spaceStarCount: space.star_count ?? 0,
          spaceForkCount: space.fork_count ?? 0,
          spaceStarredByMe: Boolean(space.starred_by_me),
          spaceCanEdit: owned,
          spaceOwnerUsername: space.creator?.username ?? null,
          spaceTags: Array.isArray(space.tags) ? space.tags : [],
        });
        setSidebarOpen(false);
        void recordSpaceView(space.slug).catch(() => {});

        toast.success(`Using “${space.title}”`);
        router.replace("/");
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.message || "Space not found");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    username,
    spaceSlug,
    router,
    applyAppearance,
    setSpaceMeta,
    setSidebarOpen,
    updateBackground,
    updateRing,
  ]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#070b14]">
        <p className="text-white/70">{error}</p>
        <Link href="/spaces" className="text-blue-300 hover:text-blue-200">
          Browse spaces
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#070b14] text-sm text-white/45">
      Opening space…
    </div>
  );
}
