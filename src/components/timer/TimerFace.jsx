"use client";

/**
 * Timer faces. All take the same inputs; `progress` is the fraction of the
 * session still remaining (1 = full, 0 = done).
 */

const MODE_LABELS = ["Focus", "Short break", "Long break"];
const MODE_ACCENTS = ["#ef4444", "#10b981", "#38bdf8"];

const SVG_BOX = "min(68vmin, 20rem)";

function clamp01(n) {
  if (!Number.isFinite(n)) return 1;
  return Math.min(1, Math.max(0, n));
}

function TimeText({ mins, secs, style, className = "" }) {
  return (
    <span
      className={`select-none tabular-nums tracking-wider ${className}`}
      style={style}
    >
      {mins}:{secs}
    </span>
  );
}

function DigitalFace({ mins, secs, textStyle }) {
  return (
    <p
      className="m-0 max-w-full min-w-[7ch] select-none text-center font-bold tabular-nums tracking-wider sm:min-w-[9ch] md:min-w-[10ch]"
      style={textStyle}
    >
      {mins}:{secs}
    </p>
  );
}

function RingFace({ mins, secs, progress, textStyle, mode }) {
  const r = 90;
  const c = 2 * Math.PI * r;
  const color = textStyle?.color || "#fff";
  return (
    <div className="relative" style={{ width: SVG_BOX, height: SVG_BOX }}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="6" style={{ color }} />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <TimeText
          mins={mins}
          secs={secs}
          className="font-bold"
          style={{ ...textStyle, fontSize: "clamp(2.25rem, 12vmin, 4.75rem)" }}
        />
        <span className="mt-1 text-xs uppercase tracking-[0.2em] opacity-60" style={{ color }}>
          {MODE_LABELS[mode]}
        </span>
      </div>
    </div>
  );
}

function GlassFace({ mins, secs, progress, ticking, remainingSeconds, textStyle }) {
  const r = 92;
  const c = 2 * Math.PI * r;
  const color = textStyle?.color || "#fff";
  const endsAt =
    remainingSeconds != null
      ? new Date(Date.now() + remainingSeconds * 1000).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="relative" style={{ width: SVG_BOX, height: SVG_BOX }}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeOpacity="0.12" strokeWidth="4" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color }}>
        <TimeText
          mins={mins}
          secs={secs}
          className="tracking-normal"
          style={{
            ...textStyle,
            fontSize: "clamp(2.75rem, 14vmin, 5.5rem)",
            fontWeight: 300,
            // The app font has no light weight; use the system face unless the space picked one.
            fontFamily:
              textStyle?.fontFamily ||
              '-apple-system, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", system-ui, sans-serif',
          }}
        />
        <span
          className={`mt-1 flex h-5 items-center gap-1 text-sm tabular-nums transition-opacity ${
            ticking ? "opacity-60" : "opacity-40"
          }`}
        >
          {endsAt ? (
            <>
              <BellIcon /> {endsAt}
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z" />
    </svg>
  );
}

function ClockFace({ mins, secs, progress, totalSeconds, mode, textStyle }) {
  // Time Timer style: a wedge of the remaining minutes on a 60-minute dial.
  const scaleMin = Math.max(60, Math.ceil((totalSeconds || 0) / 60 / 5) * 5);
  const remainingMin = (progress * (totalSeconds || 0)) / 60;
  const angle = Math.min(359.999, (remainingMin / scaleMin) * 360);
  const rad = ((angle - 90) * Math.PI) / 180;
  const R = 78;
  const x = 100 + R * Math.cos(rad);
  const y = 100 + R * Math.sin(rad);
  const wedge =
    angle <= 0
      ? ""
      : `M100 100 L100 ${100 - R} A${R} ${R} 0 ${angle > 180 ? 1 : 0} 1 ${x} ${y} Z`;
  const accent = MODE_ACCENTS[mode] ?? MODE_ACCENTS[0];
  const color = textStyle?.color || "#fff";

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: SVG_BOX, height: SVG_BOX }}>
        <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
          <circle cx="100" cy="100" r="96" fill="rgba(255,255,255,0.06)" stroke={color} strokeOpacity="0.25" strokeWidth="2" />
          {Array.from({ length: 60 }, (_, i) => {
            const a = (i * 6 - 90) * (Math.PI / 180);
            const long = i % 5 === 0;
            const r1 = long ? 84 : 88;
            return (
              <line
                key={i}
                x1={100 + r1 * Math.cos(a)}
                y1={100 + r1 * Math.sin(a)}
                x2={100 + 92 * Math.cos(a)}
                y2={100 + 92 * Math.sin(a)}
                stroke={color}
                strokeOpacity={long ? 0.7 : 0.3}
                strokeWidth={long ? 2 : 1}
              />
            );
          })}
          {wedge && <path d={wedge} fill={accent} fillOpacity="0.9" />}
          <line x1="100" y1="100" x2={x} y2={y} stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="100" r="6" fill="#fff" />
        </svg>
      </div>
      <TimeText
        mins={mins}
        secs={secs}
        className="mt-3 font-semibold"
        style={{ ...textStyle, fontSize: "clamp(1.5rem, 6vmin, 2.5rem)" }}
      />
    </div>
  );
}

function LineFace({ mins, secs, progress, mode, textStyle }) {
  const color = textStyle?.color || "#fff";
  return (
    <div className="flex w-[min(86vw,28rem)] flex-col items-center">
      <TimeText mins={mins} secs={secs} className="font-bold" style={textStyle} />
      <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: `${color}22` }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: color,
            transition: "width 1s linear",
          }}
        />
      </div>
      <div className="mt-2 flex w-full justify-between text-[11px] uppercase tracking-[0.2em] opacity-50" style={{ color }}>
        <span>{MODE_LABELS[mode]}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}

export default function TimerFace({
  timerStyle = "digital",
  mins,
  secs,
  progress,
  totalSeconds,
  remainingSeconds,
  ticking,
  mode = 0,
  textStyle,
}) {
  const p = clamp01(progress);
  const props = { mins, secs, progress: p, totalSeconds, remainingSeconds, ticking, mode, textStyle };
  const face =
    timerStyle === "ring" ? <RingFace {...props} />
    : timerStyle === "glass" ? <GlassFace {...props} />
    : timerStyle === "clock" ? <ClockFace {...props} />
    : timerStyle === "line" ? <LineFace {...props} />
    : <DigitalFace {...props} />;

  return (
    <div role="timer" aria-live="off" aria-label={`${mins}:${secs} remaining`}>
      {face}
    </div>
  );
}
