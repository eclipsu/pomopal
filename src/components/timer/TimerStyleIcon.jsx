/** Tiny preview glyph for each timer style. */
export default function TimerStyleIcon({ style, className = "h-6 w-6" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {style === "digital" && (
        <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">25</text>
      )}
      {style === "ring" && (
        <>
          <circle cx="12" cy="12" r="9" {...common} strokeOpacity="0.25" />
          <path d="M12 3 A9 9 0 1 1 3 12" {...common} />
        </>
      )}
      {style === "glass" && (
        <>
          <circle cx="12" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.25" strokeOpacity="0.3" />
          <path d="M12 3 A7 7 0 1 1 5 10" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          <circle cx="4.5" cy="20" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
          <circle cx="19.5" cy="20" r="2.5" fill="currentColor" />
        </>
      )}
      {style === "clock" && (
        <>
          <circle cx="12" cy="12" r="9" {...common} />
          <path d="M12 12 L12 4 A8 8 0 0 1 19.5 14.5 Z" fill="#ef4444" />
        </>
      )}
      {style === "line" && (
        <>
          <line x1="3" y1="15" x2="21" y2="15" {...common} strokeOpacity="0.25" />
          <line x1="3" y1="15" x2="13" y2="15" {...common} />
          <rect x="7" y="6" width="10" height="4" rx="1" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
