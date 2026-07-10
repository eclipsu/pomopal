"use client";

import { useEffect, useRef } from "react";
import { createTrackObjectUrl, resolveAudioTrack } from "@/lib/audioCache";
import { bgAudioState, bgError, bgLog, bgWarn } from "@/lib/backgroundAudioLog";

const FADE_IN_MS = 1200;
const FADE_OUT_MS = 2000;
const FADE_TICK_MS = 40;

function selectionKey(selection) {
  if (!selection) return "";
  if (selection.kind === "youtube") {
    return `youtube:${selection.videoId || selection.url}`;
  }
  if (selection.kind === "library") {
    return `library:${selection.id}`;
  }
  return "";
}

function clampVolume(volume) {
  return Math.max(0, Math.min(1, volume / 100));
}

function waitForCanPlay(audio, label) {
  bgLog(`waitForCanPlay:start (${label})`, { readyState: audio.readyState });
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    bgLog(`waitForCanPlay:already-ready (${label})`);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const onReady = (evt) => {
      bgLog(`waitForCanPlay:ready (${label})`, { event: evt.type, readyState: audio.readyState });
      audio.removeEventListener("canplay", onReady);
      audio.removeEventListener("loadedmetadata", onReady);
      resolve();
    };
    audio.addEventListener("canplay", onReady);
    audio.addEventListener("loadedmetadata", onReady);
  });
}

function attachDebugListeners(audio, label) {
  const events = [
    "loadstart",
    "loadedmetadata",
    "loadeddata",
    "canplay",
    "canplaythrough",
    "play",
    "playing",
    "pause",
    "ended",
    "waiting",
    "stalled",
    "error",
    "timeupdate",
  ];

  const handlers = events.map((eventName) => {
    const handler = (evt) => {
      if (eventName === "timeupdate") {
        const t = Math.floor(audio.currentTime);
        if (t % 30 !== 0 || audio.currentTime < 1) return;
      }
      const detail =
        eventName === "error"
          ? { code: audio.error?.code, message: audio.error?.message }
          : eventName === "loadedmetadata" || eventName === "ended"
            ? {
                currentTime: audio.currentTime,
                duration: audio.duration,
                loop: audio.loop,
                paused: audio.paused,
              }
            : undefined;
      bgLog(`event:${eventName} (${label})`, detail);
    };
    audio.addEventListener(eventName, handler);
    return { eventName, handler };
  });

  return () => {
    for (const { eventName, handler } of handlers) {
      audio.removeEventListener(eventName, handler);
    }
  };
}

export default function BackgroundAudio({
  enabled,
  volume,
  selection,
  shouldPlay,
  previewActive = false,
}) {
  const audioRef = useRef(null);
  const objectUrlRef = useRef(null);
  const targetVolumeRef = useRef(clampVolume(volume));
  const fadeTimerRef = useRef(null);
  const loopHandlerRef = useRef(null);
  const debugCleanupRef = useRef(null);
  const selectionId = selectionKey(selection);

  useEffect(() => {
    bgLog("props", {
      enabled,
      volume,
      shouldPlay,
      previewActive,
      selectionId,
      selection,
    });
  }, [enabled, volume, shouldPlay, previewActive, selectionId, selection]);

  const stopFade = (reason) => {
    if (fadeTimerRef.current != null) {
      bgLog("fade:stop", { reason });
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  const detachLoopHandler = () => {
    const audio = audioRef.current;
    const handler = loopHandlerRef.current;
    if (audio && handler) {
      bgLog("loop:detach");
      audio.removeEventListener("ended", handler);
    }
    loopHandlerRef.current = null;
  };

  const attachLoopHandler = () => {
    const audio = audioRef.current;
    if (!audio || loopHandlerRef.current) return;

    const onEnded = () => {
      bgLog("loop:ended → restart", {
        currentTime: audioRef.current?.currentTime,
        duration: audioRef.current?.duration,
      });
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        bgWarn("loop:restart play failed", err);
      });
    };

    loopHandlerRef.current = onEnded;
    audio.addEventListener("ended", onEnded);
    bgLog("loop:attach");
  };

  const fadeTo = (toVolume, durationMs, { pauseAtEnd = false, reason = "unknown" } = {}) => {
    const audio = audioRef.current;
    if (!audio) return Promise.resolve();

    stopFade("new-fade");

    const from = audio.volume;
    const to = Math.max(0, Math.min(1, toVolume));
    bgLog("fade:start", { reason, from, to, durationMs, pauseAtEnd });

    if (durationMs <= 0 || Math.abs(from - to) < 0.01) {
      audio.volume = to;
      if (pauseAtEnd) {
        audio.pause();
        bgLog("fade:instant-pause", { reason });
      }
      return Promise.resolve();
    }

    const startedAt = Date.now();
    return new Promise((resolve) => {
      fadeTimerRef.current = setInterval(() => {
        const audioEl = audioRef.current;
        if (!audioEl) {
          stopFade("audio-gone");
          resolve();
          return;
        }

        const elapsed = Date.now() - startedAt;
        const t = Math.min(1, elapsed / durationMs);
        audioEl.volume = from + (to - from) * t;

        if (t >= 1) {
          stopFade("complete");
          audioEl.volume = to;
          bgLog("fade:complete", { reason, to });
          if (pauseAtEnd) {
            audioEl.pause();
            bgAudioState(audioEl, "after fade pause");
          }
          resolve();
        }
      }, FADE_TICK_MS);
    });
  };

  const clearAudio = (reason = "unknown") => {
    bgLog("clearAudio", { reason });
    stopFade("clear");
    detachLoopHandler();
    if (debugCleanupRef.current) {
      debugCleanupRef.current();
      debugCleanupRef.current = null;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.removeAttribute("src");
    if (objectUrlRef.current) {
      bgLog("clearAudio:revokeObjectURL", { url: objectUrlRef.current.slice(0, 60) });
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    targetVolumeRef.current = clampVolume(volume);
    const audio = audioRef.current;
    bgLog("effect:volume", {
      volume,
      clamped: targetVolumeRef.current,
      shouldPlay,
      enabled,
      hasSrc: Boolean(audio?.src),
      fading: fadeTimerRef.current != null,
    });
    if (!audio?.src) return;
    if (shouldPlay && enabled && fadeTimerRef.current == null) {
      audio.volume = targetVolumeRef.current;
      bgLog("effect:volume applied live", { volume: audio.volume });
    }
  }, [volume, shouldPlay, enabled]);

  useEffect(() => {
    let cancelled = false;
    bgLog("effect:load-track", { enabled, selectionId, selection });

    if (!enabled || !selection) {
      clearAudio("disabled-or-no-selection");
      return undefined;
    }

    (async () => {
      try {
        bgLog("resolveAudioTrack:start", { selection });
        const track = await resolveAudioTrack(selection);
        if (cancelled) {
          bgLog("resolveAudioTrack:cancelled after load");
          return;
        }

        bgLog("resolveAudioTrack:done", {
          cacheKey: track.cacheKey,
          title: track.title,
          blobSize: track.blob?.size,
          durationSeconds: track.durationSeconds,
          mimeType: track.mimeType,
        });

        clearAudio("before-new-track");
        const url = createTrackObjectUrl(track);
        objectUrlRef.current = url;
        bgLog("createObjectURL", { url: url.slice(0, 80) });

        const audio = audioRef.current;
        if (!audio) {
          bgWarn("audio element ref missing after track load");
          return;
        }

        audio.loop = true;
        audio.preload = "auto";
        audio.src = url;
        audio.load();
        attachLoopHandler();
        debugCleanupRef.current = attachDebugListeners(audio, selectionId);
        await waitForCanPlay(audio, "initial-load");
        if (cancelled) {
          bgLog("load-track:cancelled after canplay");
          return;
        }

        bgAudioState(audio, "after initial canplay");
        audio.volume = 0;

        if (shouldPlay) {
          bgLog("load-track:auto-play + fade in");
          await audio.play().catch((err) => bgWarn("load-track:play failed", err));
          if (!cancelled) {
            await fadeTo(targetVolumeRef.current, FADE_IN_MS, { reason: "initial-load" });
          }
        } else {
          bgLog("load-track:loaded but shouldPlay=false, staying paused");
        }
      } catch (err) {
        bgError("load-track failed", err);
      }
    })();

    return () => {
      bgLog("effect:load-track cleanup", { selectionId });
      cancelled = true;
      clearAudio("load-effect-unmount");
    };
  }, [enabled, selectionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = audioRef.current;
    bgLog("effect:playback", {
      shouldPlay,
      enabled,
      previewActive,
      hasSrc: Boolean(audio?.src),
      paused: audio?.paused,
    });
    if (!audio?.src) return;

    let cancelled = false;

    (async () => {
      if (previewActive) {
        bgLog("playback:preview active → fade out + pause");
        await fadeTo(0, FADE_OUT_MS, { pauseAtEnd: true, reason: "preview-active" });
        return;
      }

      if (shouldPlay && enabled) {
        audio.loop = true;
        attachLoopHandler();
        if (audio.paused) {
          bgLog("playback:resume → play + fade in");
          await waitForCanPlay(audio, "resume");
          if (cancelled) return;
          audio.volume = 0;
          await audio.play().catch((err) => bgWarn("playback:resume play failed", err));
          if (!cancelled) {
            await fadeTo(targetVolumeRef.current, FADE_IN_MS, { reason: "resume" });
          }
        } else if (fadeTimerRef.current == null) {
          bgLog("playback:already playing, set volume", {
            volume: targetVolumeRef.current,
          });
          audio.volume = targetVolumeRef.current;
        } else {
          bgLog("playback:already playing but fade in progress, skip volume set");
        }
      } else {
        bgLog("playback:stop → fade out + pause", { shouldPlay, enabled });
        await fadeTo(0, FADE_OUT_MS, { pauseAtEnd: true, reason: "stop" });
      }
    })();

    return () => {
      bgLog("effect:playback cleanup");
      cancelled = true;
      stopFade("playback-effect-cleanup");
    };
  }, [shouldPlay, enabled, previewActive]); // eslint-disable-line react-hooks/exhaustive-deps

  return <audio ref={audioRef} loop preload="auto" />;
}
