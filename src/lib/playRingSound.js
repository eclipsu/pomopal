import {
  createTrackObjectUrl,
  getOrFetchLibraryAudio,
} from "@/lib/audioCache";

export const DEFAULT_ALARM_SRC = "/alarm.mp3";
export const MAX_ALARM_SOUND_MS = 7000;

/**
 * Resolve ring sound to a playable URL.
 * @returns {{ src: string, revoke: (() => void) | null }}
 */
export async function prepareAlarmSource(ringSelection) {
  if (!ringSelection || ringSelection.kind === "default") {
    return { src: DEFAULT_ALARM_SRC, revoke: null };
  }

  if (ringSelection.kind === "library") {
    const track = await getOrFetchLibraryAudio(ringSelection);
    const src = createTrackObjectUrl(track);
    return {
      src,
      revoke: () => URL.revokeObjectURL(src),
    };
  }

  return { src: DEFAULT_ALARM_SRC, revoke: null };
}
