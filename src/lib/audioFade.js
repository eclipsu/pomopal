export const FADE_TICK_MS = 40;
export const PREVIEW_FADE_OUT_MS = 1500;

export function stopAudioFade(timerRef) {
  if (timerRef.current != null) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
  const resolve = timerRef._fadeResolve;
  if (resolve) {
    timerRef._fadeResolve = undefined;
    resolve();
  }
}

export function clampAudioVolume(volumePercent) {
  return Math.max(0, Math.min(1, volumePercent / 100));
}

export function fadeAudioTo(
  audio,
  toVolume,
  durationMs,
  timerRef,
  { pauseAtEnd = false } = {},
) {
  if (!audio) return Promise.resolve();

  stopAudioFade(timerRef);

  const from = audio.volume;
  const to = Math.max(0, Math.min(1, toVolume));
  if (durationMs <= 0 || Math.abs(from - to) < 0.01) {
    audio.volume = to;
    if (pauseAtEnd) audio.pause();
    return Promise.resolve();
  }

  const startedAt = Date.now();
  return new Promise((resolve) => {
    timerRef._fadeResolve = resolve;
    timerRef.current = setInterval(() => {
      if (!audio) {
        stopAudioFade(timerRef);
        return;
      }

      const elapsed = Date.now() - startedAt;
      const t = Math.min(1, elapsed / durationMs);
      audio.volume = from + (to - from) * t;

      if (t >= 1) {
        audio.volume = to;
        if (pauseAtEnd) audio.pause();
        stopAudioFade(timerRef);
      }
    }, FADE_TICK_MS);
  });
}
