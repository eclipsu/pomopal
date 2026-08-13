"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/utils/apiBase";

/**
 * Keeps the MDX page static (SSG). After hydration:
 * 1) POSTs a unique view (IP hashed server-side)
 * 2) GETs the current count and renders it
 */
export default function RecordPostView({ slug }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    const base = getApiBaseUrl();
    const path = `${base}/posts/${encodeURIComponent(slug)}`;

    fetch(`${path}/view`, { method: "POST", keepalive: true }).catch(() => {});

    fetch(`${path}/views`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.count === "number") {
          setCount(data.count);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (count == null) return null;

  return (
    <span className="text-sm text-white/45">
      {count.toLocaleString()} {count === 1 ? "view" : "views"}
    </span>
  );
}
