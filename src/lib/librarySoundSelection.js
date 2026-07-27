import { getSoundsApiBaseUrl } from "@/utils/apiBase";

/** Backend Range-proxy endpoint for any library sound (S3 or YouTube). */
export function librarySoundStreamUrl(soundId) {
  return `${getSoundsApiBaseUrl()}/sounds/library/${soundId}/stream`;
}

/**
 * Build a sound preference selection from a public library item.
 * All library entries stream progressively via the backend Range proxy —
 * long S3 uploads must not be fully downloaded into IndexedDB.
 */
export function selectionFromLibrarySound(sound) {
  if (!sound?.id) return null;

  if (sound.source === "youtube" || sound.youtube_video_id) {
    return {
      kind: "library",
      id: sound.id,
      name: sound.name,
      source: "youtube",
      videoId: sound.youtube_video_id,
      streamUrl: librarySoundStreamUrl(sound.id),
    };
  }

  return {
    kind: "library",
    id: sound.id,
    url: sound.url,
    name: sound.name,
    source: "s3",
    streamUrl: librarySoundStreamUrl(sound.id),
  };
}

/**
 * Return a directly-playable network URL for selections that should stream
 * instead of downloading a blob. Null when the selection uses the blob path.
 */
export function getSelectionStreamUrl(selection) {
  if (!selection) return null;
  if (selection.streamUrl) return selection.streamUrl;
  if (selection.kind === "library" && selection.id) {
    // Prefer stream for any library item (S3 or YouTube).
    return librarySoundStreamUrl(selection.id);
  }
  return null;
}
