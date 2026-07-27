"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { featuredGiphy, searchGiphy } from "@/app/services/spaces";

type GiphyGif = {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  tinyUrl: string;
};

export function GiphyGifPicker({
  onSelect,
  selectedId,
}: {
  onSelect: (gif: { id: string; url: string; previewUrl: string }) => void;
  selectedId?: string | null;
}) {
  const [query, setQuery] = useState("study lofi");
  const [results, setResults] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = q.trim()
        ? await searchGiphy(q.trim(), { limit: 18 })
        : await featuredGiphy({ limit: 18 });
      if (cancelledRef.current) return;
      setResults(data.results || []);
    } catch (e: unknown) {
      if (cancelledRef.current) return;
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Could not load GIFs. Is GIPHY_API_KEY set?";
      setError(String(msg));
      setResults([]);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    void load("study lofi");
    return () => {
      cancelledRef.current = true;
    };
  }, [load]);

  return (
    <div className="flex flex-col gap-2">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load(query);
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Giphy…"
          className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#151b2b] px-2 py-1.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-400/60"
          aria-label="Search Giphy GIFs"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-400"
        >
          Search
        </button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {loading && <p className="text-xs text-white/50">Loading GIFs…</p>}

      <div className="grid max-h-48 grid-cols-3 gap-1.5 overflow-y-auto">
        {results.map((gif) => {
          const selected = selectedId === gif.id;
          return (
            <button
              key={gif.id}
              type="button"
              title={gif.title}
              onClick={() =>
                onSelect({
                  id: gif.id,
                  url: gif.url,
                  previewUrl: gif.previewUrl || gif.tinyUrl,
                })
              }
              className={`aspect-square overflow-hidden rounded-lg border-2 ${
                selected ? "border-blue-400" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gif.tinyUrl || gif.previewUrl}
                alt={gif.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-white/35">GIFs via Giphy</p>
    </div>
  );
}
