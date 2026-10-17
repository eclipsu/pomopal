/** Timer faces. Keep values in sync with backend TIMER_STYLES (space layout). */
export const TIMER_STYLES = [
  { value: "digital", label: "Digital", hint: "Big numbers" },
  { value: "ring", label: "Ring", hint: "Circle counts down" },
  { value: "glass", label: "Glass", hint: "Thin ring, round buttons" },
  { value: "clock", label: "Clock", hint: "Shrinking wedge" },
  { value: "line", label: "Line", hint: "Bar drains away" },
];

export const DEFAULT_TIMER_STYLE = "digital";

/**
 * Per-space timer style needs the backend to accept `layout.timerStyle`
 * (it rejects unknown layout keys). Flip on once that backend ships.
 */
export const SPACE_TIMER_STYLE_ENABLED = false;

export function isTimerStyle(value) {
  return TIMER_STYLES.some((s) => s.value === value);
}

/** Space style wins when set; otherwise the viewer's own preference. */
export function resolveTimerStyle(spaceStyle, personalStyle) {
  if (isTimerStyle(spaceStyle)) return spaceStyle;
  if (isTimerStyle(personalStyle)) return personalStyle;
  return DEFAULT_TIMER_STYLE;
}
