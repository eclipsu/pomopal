/** Human-readable label for a library image ({ key, name, url }). */
export function imageLibraryLabel(img) {
  if (!img) return "";
  if (img.name?.trim()) return img.name.trim();
  if (!img.key) return "";
  const stem = img.key.replace("notification-templates/", "").replace(/\.webp$/i, "");
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stem)) {
    return `Image ${stem.slice(0, 8)}`;
  }
  return stem;
}

/** Default name from a File before upload. */
export function nameFromFile(file) {
  if (!file?.name) return "image";
  const base = file.name.replace(/^.*[/\\]/, "").replace(/\.[^.]+$/, "") || "image";
  return base.slice(0, 120);
}
