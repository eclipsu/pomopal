const PREFIX = "[bg-audio]";

export function bgLog(...args) {
  console.log(PREFIX, ...args);
}

export function bgWarn(...args) {
  console.warn(PREFIX, ...args);
}

export function bgError(...args) {
  console.error(PREFIX, ...args);
}

export function bgGroup(label, fn) {
  console.groupCollapsed(`${PREFIX} ${label}`);
  try {
    return fn();
  } finally {
    console.groupEnd();
  }
}

export function bgAudioState(audio, label = "audio state") {
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
