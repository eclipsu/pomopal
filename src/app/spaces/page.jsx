"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Paintbrush, Search } from "lucide-react";
import { browseSpaces } from "@/app/services/spaces";
import { SpaceCard, SpacesPageShell } from "@/components/space/SpaceCard";

export default function SpacesGalleryPage() {
  const [q, setQ] = useState("");
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    try {
      const data = await browseSpaces({ q: query, limit: 36 });
      if (cancelledRef.current) return;
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      if (cancelledRef.current) return;
      setError(e?.response?.data?.message || "Could not load spaces");
      setItems([]);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q") || "";
    setInput(initial);
    setQ(initial);
    void load(initial);
    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  return (
    <SpacesPageShell
      title="Spaces"
      subtitle="Focus rooms from the community — open one and it drops straight onto your timer."
      action={
        <Link
          href="/"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400"
        >
          <Paintbrush size={15} />
          Create yours
        </Link>
      }
    >
      <form
        className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-stretch"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input);
          const url = new URL(window.location.href);
          if (input.trim()) url.searchParams.set("q", input.trim());
          else url.searchParams.delete("q");
          window.history.replaceState({}, "", url);
          void load(input.trim());
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search study, lofi, rain, deep work…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Search
        </button>
      </form>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[16/11] animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]"
            />
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-14 text-center">
          <p className="text-sm text-white/55">
            No public spaces yet{q ? ` for “${q}”` : ""}.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"
          >
            <Paintbrush size={14} />
            Open the paintbrush and publish one
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-white/35">
            Showing {items.length} of {total}
          </p>
        </>
      )}
    </SpacesPageShell>
  );
}
