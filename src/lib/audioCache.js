import { getApiBaseUrl, getSoundsApiBaseUrl } from "@/utils/apiBase";
import { extractYoutubeVideoId } from "@/lib/youtube.util";
import { bgLog, bgWarn } from "@/lib/backgroundAudioLog";

const DB_NAME = "pomopal-audio";
const DB_VERSION = 1;
const STORE = "tracks";

export const AudioSource = {
  YOUTUBE: "youtube",
  LIBRARY: "library",
};

let dbPromise = null;

export function isAudioCacheAvailable() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

export function makeCacheKey(source, id) {
  return `${source}:${id}`;
}

export function parseVersionFromUrl(url) {
  try {
    return new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost").searchParams.get("v") || null;
  } catch {
    return null;
  }
}

/** Same-origin URL for library audio (avoids S3 CORS). */
export function librarySoundFileUrl(soundId, version) {
  const base = `${getApiBaseUrl()}/sounds/library/${soundId}/file`;
  if (!version) return base;
  return `${base}?v=${encodeURIComponent(version)}`;
}

function openDb() {
  if (!isAudioCacheAvailable()) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        dbPromise = null;
        reject(request.error ?? new Error("Failed to open audio cache"));
      };

      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "cacheKey" });
          store.createIndex("source", "source", { unique: false });
          store.createIndex("cachedAt", "cachedAt", { unique: false });
        }
      };
    });
  }

  return dbPromise;
}

function withStore(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);

        let result;
        tx.oncomplete = () => resolve(result);
        tx.onerror = () =>
          reject(tx.error ?? new Error("Audio cache transaction failed"));
        tx.onabort = () =>
          reject(tx.error ?? new Error("Audio cache transaction aborted"));

        Promise.resolve(fn(store))
          .then((value) => {
            result = value;
          })
          .catch(reject);
      }),
  );
}

function toTrack(record) {
  if (!record?.blob) return null;
  return {
    cacheKey: record.cacheKey,
    source: record.source,
    sourceId: record.sourceId,
    title: record.title,
    mimeType: record.mimeType,
    durationSeconds: record.durationSeconds ?? null,
    sourceUrl: record.sourceUrl ?? null,
    sourceVersion: record.sourceVersion ?? null,
    cachedAt: record.cachedAt,
    blob: record.blob,
  };
}

/** Read a cached track by source + id. Returns null when missing. */
export async function getCachedTrack(source, id) {
  if (!isAudioCacheAvailable()) {
    bgLog("cache:get — IndexedDB unavailable", { source, id });
    return null;
  }

  const cacheKey = makeCacheKey(source, id);
  bgLog("cache:get", { cacheKey });
  const record = await withStore("readonly", (store) => {
    return new Promise((resolve, reject) => {
      const request = store.get(cacheKey);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  });

  const track = toTrack(record);
  bgLog("cache:get result", {
    cacheKey,
    found: Boolean(track),
    blobSize: track?.blob?.size,
    durationSeconds: track?.durationSeconds,
  });
  return track;
}

/** Persist a track blob. Returns the stored record. */
export async function putCachedTrack(source, id, data) {
  if (!isAudioCacheAvailable()) {
    throw new Error("IndexedDB is not available");
  }

  const cacheKey = makeCacheKey(source, id);
  const record = {
    cacheKey,
    source,
    sourceId: id,
    title: data.title ?? id,
    mimeType: data.mimeType ?? "audio/mpeg",
    durationSeconds:
      typeof data.durationSeconds === "number" ? data.durationSeconds : null,
    sourceUrl: data.sourceUrl ?? null,
    sourceVersion: data.sourceVersion ?? null,
    cachedAt: Date.now(),
    blob: data.blob,
  };

  await withStore("readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });

  bgLog("cache:put", {
    cacheKey,
    blobSize: data.blob?.size,
    title: record.title,
    durationSeconds: record.durationSeconds,
  });
  return toTrack(record);
}

/** Remove one cached track. */
export async function deleteCachedTrack(source, id) {
  if (!isAudioCacheAvailable()) return;

  const cacheKey = makeCacheKey(source, id);
  bgLog("cache:delete", { cacheKey });
  await withStore("readwrite", (store) => {
    return new Promise((resolve, reject) => {
      const request = store.delete(cacheKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

/** List cached tracks, optionally filtered by source. */
export async function listCachedTracks(source) {
  if (!isAudioCacheAvailable()) return [];

  const records = await withStore("readonly", (store) => {
    return new Promise((resolve, reject) => {
      const request = source
        ? store.index("source").getAll(source)
        : store.getAll();
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error);
    });
  });

  return records.map(toTrack).filter(Boolean);
}

async function parseApiError(response, fallback) {
  try {
    const body = await response.json();
    const message = body?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === "string") return message;
  } catch {
    // ignore
  }
  return fallback;
}

const STREAM_MARKER = "---AUDIO---\n";
const STREAM_MARKER_BYTES = new TextEncoder().encode(STREAM_MARKER);

function concatChunks(chunks) {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function indexOfSubarray(haystack, needle) {
  if (needle.length === 0) return 0;
  for (let i = 0; i <= haystack.length - needle.length; i += 1) {
    let found = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

function parseProgressLine(line, onProgress) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const evt = JSON.parse(trimmed);
  if (evt.phase === "error") {
    throw new Error(evt.message || "Could not extract audio from this video");
  }
  if (evt.phase === "done") {
    return evt;
  }
  if (typeof evt.percent === "number") {
    onProgress?.({
      phase: evt.phase || "download",
      percent: evt.percent,
    });
  }
  return null;
}

function indexOfByte(haystack, byte, from = 0) {
  for (let i = from; i < haystack.length; i += 1) {
    if (haystack[i] === byte) return i;
  }
  return -1;
}

function parseHeaderLines(buffer, onProgress) {
  let offset = 0;
  let doneMeta = null;

  while (offset < buffer.length) {
    const newlineIdx = indexOfByte(buffer, 0x0a, offset);
    if (newlineIdx < 0) break;

    const lineBytes = buffer.slice(offset, newlineIdx);
    offset = newlineIdx + 1;
    if (!lineBytes.length) continue;

    const line = new TextDecoder().decode(lineBytes).trim();
    if (!line) continue;

    const meta = parseProgressLine(line, onProgress);
    if (meta) {
      doneMeta = meta;
      return { doneMeta, headerEnd: offset, complete: true };
    }
  }

  return { doneMeta: null, headerEnd: offset, complete: false };
}

function isLikelyTruncatedTrack(track) {
  if (!track?.blob || !track.durationSeconds) return false;
  const minBytes = Math.max(200_000, track.durationSeconds * 3_000);
  const truncated = track.blob.size < minBytes;
  if (truncated) {
    bgWarn("cache:truncated track detected", {
      cacheKey: track.cacheKey,
      blobSize: track.blob.size,
      durationSeconds: track.durationSeconds,
      minBytes,
    });
  }
  return truncated;
}

async function consumeStreamingYoutubeResponse(response, onProgress) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Streaming not supported");
  }

  bgLog("youtube:stream start");
  const chunks = [];
  let doneMeta = null;
  let headerEnd = 0;
  let chunkCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (value?.length) {
      chunks.push(value);
      chunkCount += 1;
      if (chunkCount === 1 || chunkCount % 50 === 0 || done) {
        const totalBytes = chunks.reduce((sum, c) => sum + c.length, 0);
        bgLog("youtube:stream chunk", { chunkCount, chunkBytes: value.length, totalBytes });
      }
    }

    const combined = concatChunks(chunks);
    const header = parseHeaderLines(combined, onProgress);

    if (header.doneMeta) {
      doneMeta = header.doneMeta;
      headerEnd = header.headerEnd;
      bgLog("youtube:stream done header", {
        videoId: doneMeta.videoId,
        title: doneMeta.title,
        durationSeconds: doneMeta.durationSeconds,
        byteLength: doneMeta.byteLength,
        headerEnd,
      });
    }

    if (doneMeta?.byteLength != null) {
      const audioEnd = headerEnd + doneMeta.byteLength;
      if (combined.length >= audioEnd) {
        const audioBytes = combined.slice(headerEnd, audioEnd);
        const mimeType = doneMeta.mimeType || "audio/mp4";
        return {
          blob: new Blob([audioBytes], { type: mimeType }),
          videoId: doneMeta.videoId,
          title: doneMeta.title,
          durationSeconds: doneMeta.durationSeconds ?? null,
          mimeType,
        };
      }
    }

    if (doneMeta?.byteLength == null && header.complete && doneMeta) {
      const markerIdx = indexOfSubarray(combined, STREAM_MARKER_BYTES);
      if (markerIdx >= 0) {
        const audioBytes = combined.slice(markerIdx + STREAM_MARKER_BYTES.length);
        const mimeType = doneMeta.mimeType || "audio/mp4";
        bgWarn("youtube:stream complete (legacy marker fallback)", {
          markerIdx,
          audioBytes: audioBytes.length,
        });
        return {
          blob: new Blob([audioBytes], { type: mimeType }),
          videoId: doneMeta.videoId,
          title: doneMeta.title,
          durationSeconds: doneMeta.durationSeconds ?? null,
          mimeType,
        };
      }
    }

    if (done && !doneMeta?.videoId) {
      bgWarn("youtube:stream ended without done meta", { totalBytes: combined.length });
      for (const line of new TextDecoder()
        .decode(combined)
        .split("\n")
        .filter(Boolean)) {
        parseProgressLine(line, onProgress);
      }
      throw new Error("Incomplete audio stream");
    }

    if (done) {
      bgWarn("youtube:stream ended incomplete", {
        hasDoneMeta: Boolean(doneMeta),
        byteLength: doneMeta?.byteLength,
        buffered: combined.length,
        headerEnd,
      });
      break;
    }
  }

  throw new Error("Incomplete audio stream");
}

const PHASE_LABELS = {
  meta: "Fetching video info",
  download: "Downloading audio",
  encode: "Finishing up",
};

export function youtubeProgressLabel(phase) {
  return PHASE_LABELS[phase] || "Processing";
}

/**
 * Return cached YouTube audio or parse via backend once, then cache.
 * @param {string} url - YouTube URL or video ID
 * @param {{ onProgress?: (evt: { phase: string, percent: number }) => void }} [options]
 */
export async function getOrParseYoutubeAudio(url, options = {}) {
  const { onProgress } = options;
  const videoId = extractYoutubeVideoId(url);
  bgLog("youtube:resolve start", { url, videoId });
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const cached = await getCachedTrack(AudioSource.YOUTUBE, videoId);
  if (cached && !isLikelyTruncatedTrack(cached)) {
    bgLog("youtube:cache hit", { videoId, blobSize: cached.blob.size });
    onProgress?.({ phase: "done", percent: 100 });
    return cached;
  }
  if (cached) {
    bgWarn("youtube:deleting truncated cache, re-fetching", { videoId });
    await deleteCachedTrack(AudioSource.YOUTUBE, videoId);
  }

  bgLog("youtube:fetch from backend", { videoId });
  const response = await fetch(
    `${getSoundsApiBaseUrl()}/sounds/parse-youtube?stream=1`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseApiError(
        response,
        "Could not extract audio from this video",
      ),
    );
  }

  const streamed = await consumeStreamingYoutubeResponse(response, onProgress);
  const title = streamed.title || videoId;
  bgLog("youtube:parsed", {
    videoId,
    title,
    blobSize: streamed.blob.size,
    durationSeconds: streamed.durationSeconds,
  });

  return putCachedTrack(AudioSource.YOUTUBE, videoId, {
    title,
    mimeType: streamed.mimeType || streamed.blob.type || "audio/mp4",
    durationSeconds: streamed.durationSeconds || null,
    sourceUrl: url,
    blob: streamed.blob,
  });
}

/**
 * Return cached library sound or fetch from S3 once, then cache.
 * @param {{ id: string, url: string, name?: string }} sound
 */
export async function getOrFetchLibraryAudio(sound) {
  bgLog("library:resolve start", { id: sound?.id, url: sound?.url });
  if (!sound?.id) {
    throw new Error("Invalid library sound");
  }

  const version = parseVersionFromUrl(sound.url);
  const cached = await getCachedTrack(AudioSource.LIBRARY, sound.id);
  if (cached && cached.sourceVersion === version) {
    bgLog("library:cache hit", { id: sound.id, blobSize: cached.blob.size });
    return cached;
  }

  const fetchUrl = librarySoundFileUrl(sound.id, version);
  bgLog("library:fetch from api", { id: sound.id, version, fetchUrl });
  const response = await fetch(fetchUrl, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Could not load sound");
  }

  const blob = await response.blob();
  const mimeType =
    blob.type ||
    response.headers.get("Content-Type") ||
    "audio/mpeg";
  bgLog("library:fetched", { id: sound.id, blobSize: blob.size, type: mimeType });

  return putCachedTrack(AudioSource.LIBRARY, sound.id, {
    title: sound.name ?? sound.id,
    mimeType,
    sourceUrl: fetchUrl,
    sourceVersion: version,
    blob,
  });
}

/**
 * Download and cache a sound selection in the background (library or YouTube).
 * Safe to call fire-and-forget when the user picks a sound.
 */
export async function prefetchAudioSelection(selection) {
  if (!selection?.kind) return null;

  try {
    if (selection.kind === "library") {
      return await getOrFetchLibraryAudio(selection);
    }
    if (selection.kind === "youtube") {
      return await getOrParseYoutubeAudio(selection.url);
    }
  } catch (err) {
    bgWarn("prefetch failed", { selection, err });
  }
  return null;
}

/**
 * Resolve any sound selection to a cached track.
 * @param {{ kind: 'youtube', url: string } | { kind: 'library', id: string, url: string, name?: string }} selection
 */
export async function resolveAudioTrack(selection) {
  bgLog("resolveAudioTrack", { kind: selection?.kind, selection });
  if (!selection?.kind) {
    throw new Error("Invalid sound selection");
  }

  if (selection.kind === "youtube") {
    const track = await getOrParseYoutubeAudio(selection.url);
    bgLog("resolveAudioTrack:youtube done", { cacheKey: track.cacheKey });
    return track;
  }

  if (selection.kind === "library") {
    const track = await getOrFetchLibraryAudio(selection);
    bgLog("resolveAudioTrack:library done", { cacheKey: track.cacheKey });
    return track;
  }

  throw new Error("Unknown sound selection");
}

/** Create an object URL for a cached track. Caller must revoke when done. */
export function createTrackObjectUrl(track) {
  if (!track?.blob) {
    bgWarn("createTrackObjectUrl: no blob", { track });
    return null;
  }
  const url = URL.createObjectURL(track.blob);
  bgLog("createTrackObjectUrl", {
    cacheKey: track.cacheKey,
    blobSize: track.blob.size,
    url: url.slice(0, 80),
  });
  return url;
}
