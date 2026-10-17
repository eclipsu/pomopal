"use client";

import { useEffect } from "react";

/**
 * Close a popup on Escape or a click outside `ref`.
 * Uses mousedown/touchstart so a drag that ends outside doesn't count as inside.
 * Clicks in toasts or in portals marked `data-keep-open` (e.g. a crop dialog
 * opened from inside the popup) don't count as outside.
 */
export function useDismiss(ref, open, onClose) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      if (e.target instanceof Element && e.target.closest("[data-keep-open], .Toastify")) {
        return;
      }
      onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, onClose]);
}
