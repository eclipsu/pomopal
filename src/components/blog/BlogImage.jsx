import fs from "fs";
import path from "path";
import Image from "next/image";
import { blogAssetUrl } from "@/utils/mediaUrl";

/**
 * Blog image from coverImage frontmatter or MDX src.
 * Local `/blog/...` files are served from public/ (no Next image cache),
 * with a mtime query so replacing a PNG shows up immediately.
 */
function withFileBust(url) {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return url;
  const clean = url.split("?")[0];
  const file = path.join(process.cwd(), "public", clean);
  try {
    const t = Math.round(fs.statSync(file).mtimeMs);
    return `${clean}?v=${t}`;
  } catch {
    return clean;
  }
}

export default function BlogImage({
  src,
  alt = "",
  fill = false,
  width,
  height,
  className = "",
  sizes,
  priority = false,
}) {
  const resolved = blogAssetUrl(src);
  if (!resolved) return null;

  const isRemote =
    resolved.startsWith("http://") || resolved.startsWith("https://");
  const url = isRemote ? resolved : withFileBust(resolved);

  if (fill) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt}
      width={width ?? 1200}
      height={height ?? 675}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized
    />
  );
}
