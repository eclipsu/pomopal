"use client";

import Link from "next/link";
import { Eye, GitFork, Star, User } from "lucide-react";

export function SpaceInfoPanel({
  space,
  onUse,
  using,
  onFork,
  forking,
  onToggleStar,
  starring,
  shareUrl,
}: {
  space: {
    title: string;
    description?: string | null;
    tags?: string[];
    view_count?: number;
    star_count?: number;
    fork_count?: number;
    starred_by_me?: boolean;
    slug: string;
    path?: string;
    visibility?: string;
    can_edit?: boolean;
    creator?: {
      name?: string;
      username?: string | null;
      avatar_url?: string | null;
    } | null;
  };
  onUse?: () => void;
  using?: boolean;
  onFork?: () => void;
  forking?: boolean;
  onToggleStar?: () => void;
  starring?: boolean;
  shareUrl?: string;
}) {
  const profileHref = space.creator?.username
    ? `/${space.creator.username}`
    : null;

  return (
    <aside className="flex w-full max-w-[22rem] flex-col border-l border-white/10 bg-[#0b1220] text-white md:max-w-[26rem]">
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0d1528] to-[#111a30] px-5 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300/80">
          Pomopal Space
        </p>
      </div>
      <div className="space-y-4 overflow-y-auto p-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {space.title}
          </h1>
          {space.description && (
            <p className="mt-2 text-sm text-white/60">{space.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-white/80">
          {space.creator?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={space.creator.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <User size={16} className="text-blue-300" />
            </span>
          )}
          <div>
            {profileHref ? (
              <Link href={profileHref} className="font-medium hover:text-blue-300">
                {space.creator?.name || space.creator?.username}
              </Link>
            ) : (
              <p className="font-medium">{space.creator?.name || "Anonymous"}</p>
            )}
            <p className="text-xs text-white/40">
              {space.creator?.username
                ? `@${space.creator.username}`
                : "Creator"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <Eye size={16} className="text-blue-400" />
            {space.view_count ?? 0}
          </span>
          <button
            type="button"
            disabled={!onToggleStar || starring}
            onClick={onToggleStar}
            className="inline-flex items-center gap-1.5 hover:text-amber-300 disabled:cursor-default"
            title={space.starred_by_me ? "Unstar" : "Star"}
          >
            <Star
              size={16}
              className={
                space.starred_by_me
                  ? "fill-amber-400 text-amber-400"
                  : "text-amber-400"
              }
            />
            {space.star_count ?? 0}
          </button>
          <span className="inline-flex items-center gap-1.5">
            <GitFork size={16} className="text-blue-400" />
            {space.fork_count ?? 0}
          </span>
        </div>

        {space.tags && space.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {space.tags.map((tag) => (
              <Link
                key={tag}
                href={`/spaces?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs text-blue-200 hover:bg-blue-500/25"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {shareUrl && (
          <button
            type="button"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white hover:bg-white/10"
            onClick={() => navigator.clipboard?.writeText(shareUrl)}
          >
            Copy link
          </button>
        )}

        {onUse && (
          <button
            type="button"
            disabled={using}
            onClick={onUse}
            className="w-full rounded-xl bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-400 disabled:opacity-50"
          >
            {using ? "Applying…" : "Use on my timer"}
          </button>
        )}

        {onFork && (
          <button
            type="button"
            disabled={forking}
            onClick={onFork}
            className="w-full rounded-xl border border-blue-400/40 bg-blue-500/15 px-3 py-2 text-sm font-medium text-blue-200 hover:bg-blue-500/25 disabled:opacity-50"
          >
            {forking ? "Forking…" : "Fork to edit"}
          </button>
        )}

        <p className="text-xs text-white/40">
          Use this space on your timer right away. Open the paintbrush to
          customize — fork first if it isn&apos;t yours.
        </p>
      </div>
    </aside>
  );
}
