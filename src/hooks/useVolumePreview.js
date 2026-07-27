"use client";

import { useCallback, useEffect, useRef } from "react";
import { bgLog, bgWarn } from "@/lib/backgroundAudioLog";
import { createTrackObjectUrl, resolveAudioTrack } from "@/lib/audioCache";
import {
  clampAudioVolume,
  fadeAudioTo,
  PREVIEW_FADE_OUT_MS,
  stopAudioFade,
} from "@/lib/audioFade";
import { MAX_ALARM_SOUND_MS, prepareAlarmSource } from "@/lib/playRingSound";
import { getSelectionStreamUrl } from "@/lib/librarySoundSelection";

export function useVolumePreview(setPreviewActive) {
  const audioRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const cleanupRef = useRef(null);
  const activeKindRef = useRef(null);
  const loadTokenRef = useRef(0);
  const stopTimerRef = useRef(null);

  const clearStopTimer = useCallback(() => {
    if (stopTimerRef.current != null) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  const releaseSrc = useCallback(() => {
    bgLog("preview:releaseSrc", { kind: activeKindRef.current });
    clearStopTimer();
    const audio = audioRef.current;
    const pendingCleanup = cleanupRef.current;
    cleanupRef.current = null;
    activeKindRef.current = null;

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    if (pendingCleanup) pendingCleanup();
  }, [clearStopTimer]);

  const cleanup = useCallback(() => {
    bgLog("preview:cleanup");
    loadTokenRef.current += 1;
    stopAudioFade(fadeTimerRef);
    releaseSrc();
    setPreviewActive?.(false);
  }, [releaseSrc, setPreviewActive]);

  useEffect(() => cleanup, [cleanup]);

  const beginPreview = useCallback(
    async (kind, selection, volumePercent) => {
      bgLog("preview:begin", { kind, volumePercent, selection });
      if (activeKindRef.current === kind && audioRef.current?.getAttribute("src")) {
        bgLog("preview:update existing", { kind, volumePercent });
        stopAudioFade(fadeTimerRef);
        audioRef.current.volume = clampAudioVolume(volumePercent);
        if (audioRef.current.paused) {
          await audioRef.current.play().catch(() => {});
        }
        return;
      }

      const token = ++loadTokenRef.current;
      stopAudioFade(fadeTimerRef);
      releaseSrc();
      setPreviewActive?.(true);

      try {
        let src;
        let loop;
        let cleanupFn = null;

        if (kind === "background") {
          if (!selection) {
            bgWarn("preview:background — no selection");
            setPreviewActive?.(false);
            return;
          }
          const streamUrl = getSelectionStreamUrl(selection);
          if (streamUrl) {
            bgLog("preview:background stream url", { streamUrl });
            src = streamUrl;
            loop = true;
            cleanupFn = null;
          } else {
            bgLog("preview:background loading track");
            const track = await resolveAudioTrack(selection);
            if (token !== loadTokenRef.current) return;
            const objectUrl = createTrackObjectUrl(track);
            if (token !== loadTokenRef.current) {
              URL.revokeObjectURL(objectUrl);
              return;
            }
            src = objectUrl;
            loop = true;
            cleanupFn = () => URL.revokeObjectURL(src);
            bgLog("preview:background ready", { cacheKey: track.cacheKey, src: src.slice(0, 60) });
          }
        } else if (kind === "ring") {
          bgLog("preview:ring loading source");
          const prepared = await prepareAlarmSource(selection);
          if (token !== loadTokenRef.current) {
            prepared.revoke?.();
            return;
          }
          src = prepared.src;
          loop = false;
          cleanupFn = prepared.revoke;
        } else {
          setPreviewActive?.(false);
          return;
        }

        const audio = audioRef.current;
        if (!audio || token !== loadTokenRef.current) {
          cleanupFn?.();
          return;
        }

        audio.loop = loop;
        audio.src = src;
        audio.load();
        audio.volume = clampAudioVolume(volumePercent);
        cleanupRef.current = cleanupFn;
        activeKindRef.current = kind;

        bgLog("preview:play", { kind, volume: audio.volume, loop });
        await audio.play().catch((err) => bgWarn("preview:play failed", err));
        if (kind === "ring") {
          clearStopTimer();
          stopTimerRef.current = setTimeout(() => {
            bgLog("preview:ring auto-stop");
            if (activeKindRef.current === "ring") {
              cleanup();
            }
          }, MAX_ALARM_SOUND_MS);
        }
      } catch (err) {
        bgWarn("preview:failed", err);
        if (token === loadTokenRef.current) {
          cleanup();
        }
      }
    },
    [cleanup, clearStopTimer, releaseSrc, setPreviewActive],
  );

  const setPreviewVolume = useCallback((volumePercent) => {
    const audio = audioRef.current;
    if (!audio?.getAttribute("src")) return;
    bgLog("preview:setVolume", { volumePercent, kind: activeKindRef.current });
    stopAudioFade(fadeTimerRef);
    audio.volume = clampAudioVolume(volumePercent);
    if (audio.paused) {
      audio.play().catch(() => {});
    }
  }, []);

  const endPreview = useCallback(async () => {
    bgLog("preview:end", { kind: activeKindRef.current });
    const audio = audioRef.current;
    if (!audio?.getAttribute("src")) {
      cleanup();
      return;
    }

    loadTokenRef.current += 1;
    await fadeAudioTo(audio, 0, PREVIEW_FADE_OUT_MS, fadeTimerRef, {
      pauseAtEnd: true,
    });
    releaseSrc();
    setPreviewActive?.(false);
  }, [cleanup, releaseSrc, setPreviewActive]);

  return {
    previewAudioRef: audioRef,
    beginPreview,
    setPreviewVolume,
    endPreview,
  };
}
