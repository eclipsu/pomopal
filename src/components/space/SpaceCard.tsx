"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Eye, GitFork, Paintbrush, Star } from "lucide-react";
import { spacePath } from "@/app/services/spaces";

type SpaceCardSpace = {
  id?: string | number;
  title?: string;
  cover_image_url?: string | null;
  layout?: { backgroundColor?: string } | null;
  path?: string;
  slug?: string;
  view_count?: number;
  star_count?: number;
  fork_count?: number;
  tags?: string[];
  creator?: {
    username?: string | null;
    name?: string | null;
  } | null;
};

export function SpaceCard({
  space,
  showCreator = true,
}: {
  space: SpaceCardSpace;
  showCreator?: boolean;
}) {
  const cover = space.cover_image_url;
  const bg = space.layout?.backgroundColor || "#111827";
  const href = spacePath(space);

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121a2b] transition duration-300 hover:-translate-y-0.5 hover:border-blue-400/40 hover:shadow-[0_18px_40px_-24px_rgba(59,130,246,0.55)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <div
          className="absolute inset-0 scale-100 transition duration-500 group-hover:scale-105"
          style={
            cover
              ? {
                  backgroundImage: `url(${cover})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : { backgroundColor: bg }
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/35 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-tight text-white">
              {space.title || "Untitled space"}
            </h2>
            {showCreator && (
              <p className="mt-0.5 truncate text-xs text-white/55">
                {space.creator?.username
                  ? `@${space.creator.username}`
                  : space.creator?.name || "Anonymous"}
              </p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-500/20 px-2 py-1 text-[11px] font-medium text-blue-200 opacity-0 transition group-hover:opacity-100">
            <Paintbrush size={12} />
            Use
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="flex items-center gap-3 text-[11px] text-white/45">
          <span className="inline-flex items-center gap-1">
            <Eye size={12} className="text-blue-300/80" />
            {space.view_count ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star size={12} className="text-amber-300/80" />
            {space.star_count ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork size={12} className="text-blue-300/80" />
            {space.fork_count ?? 0}
          </span>
        </div>
        {space.tags?.length > 0 && (
          <div className="hidden min-w-0 truncate sm:block">
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">
              {space.tags[0]}
              {space.tags.length > 1 ? ` +${space.tags.length - 1}` : ""}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function SpacesPageShell({
  backHref = "/",
  backLabel = "Pomopal",
  title,
  subtitle,
  action,
  children,
}: {
  backHref?: string;
  backLabel?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#070b14] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 420px at 15% -10%, rgba(59,130,246,0.22), transparent 60%), radial-gradient(700px 380px at 90% 0%, rgba(37,99,235,0.12), transparent 55%), linear-gradient(180deg, #0b1220 0%, #070b14 45%, #060911 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="relative border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-5 py-8 sm:px-8 sm:py-10">
          <div className="min-w-0">
            <Link
              href={backHref}
              className="text-sm text-white/45 transition hover:text-white/80"
            >
              ← {backLabel}
            </Link>
            <h1 className="mt-3 font-sans text-3xl tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
