import Image from "next/image";
import { blogAssetUrl } from "@/utils/mediaUrl";

/**
 * Blog image from coverImage frontmatter or MDX src.
 * Keys like `blog/foo.webp` resolve to the public S3/CDN base.
 */
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
  const url = blogAssetUrl(src);
  if (!url) return null;

  const isRemote = url.startsWith("http://") || url.startsWith("https://");

  if (fill) {
    return (
      <Image
        src={url}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized={isRemote}
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
      unoptimized={isRemote}
    />
  );
}
