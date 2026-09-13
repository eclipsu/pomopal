const PREFIX = "[bg-audio]";

/** Opt in: localStorage.setItem("pomopal:bg-audio-debug", "1") then reload. */
export function bgAudioDebugEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("pomopal:bg-audio-debug") === "1";
  } catch {
    return false;
  }
}

export function bgLog(...args) {
  if (!bgAudioDebugEnabled()) return;
  console.log(PREFIX, ...args);
}

export function bgWarn(...args) {
  if (!bgAudioDebugEnabled()) return;
  console.warn(PREFIX, ...args);
}

export function bgError(...args) {
  // Always surface real failures; mute only the chatty path.
  console.error(PREFIX, ...args);
}

export function bgGroup(label, fn) {
  if (!bgAudioDebugEnabled()) return fn();
  console.groupCollapsed(`${PREFIX} ${label}`);
  try {
    return fn();
  } finally {
    console.groupEnd();
  }
}

export function bgAudioState(audio, label = "audio state") {
  if (!bgAudioDebugEnabled()) return;
  if (!audio) {
    bgLog(label, { audio: null });
    return;
  }
  bgLog(label, {
    src: audio.src ? `${audio.src.slice(0, 60)}…` : null,
    paused: audio.paused,
    ended: audio.ended,
    loop: audio.loop,
    currentTime: audio.currentTime,
    duration: Number.isFinite(audio.duration) ? audio.duration : null,
    volume: audio.volume,
    readyState: audio.readyState,
    networkState: audio.networkState,
    muted: audio.muted,
  });
}
