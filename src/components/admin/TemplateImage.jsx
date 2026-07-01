"use client";

import { mediaUrl } from "@/utils/mediaUrl";

/** Renders a template image at its natural size, capped by maxHeightClass. */
export default function TemplateImage({
  src,
  alt = "",
  maxHeightClass = "max-h-32",
  className = "",
}) {
  if (!src) return null;
  const url = mediaUrl(src);
  if (!url) return null;

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={url}
      alt={alt}
      className={`block w-auto h-auto max-w-full ${maxHeightClass} rounded-lg border border-white/10 ${className}`}
    />
  );
}
