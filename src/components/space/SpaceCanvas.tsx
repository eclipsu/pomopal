"use client";

import {
  buildBackgroundCss,
  buildTimerBoxCss,
  buildTimerTextCss,
  type SpaceAppearance,
} from "@/stores/useSpaceStore";

/** Read-only space canvas for public views — never mutates remote layout. */
export function SpaceCanvas({
  appearance,
  timeLabel = "25:00",
}: {
  appearance: SpaceAppearance;
  timeLabel?: string;
}) {
  const bg = buildBackgroundCss(appearance);
  const box = buildTimerBoxCss(appearance);
  const text = buildTimerTextCss(appearance);

  return (
    <div className="relative h-full min-h-[28rem] w-full overflow-hidden" style={bg}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="px-4 text-white flex flex-col justify-center items-center"
          style={box}
        >
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 max-w-full">
            {["Pomodoro", "Short Break", "Long Break"].map((option, index) => (
              <span
                key={option}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-xl ${
                  index === 0 ? "bg-white/15 text-white" : "text-white/60"
                }`}
              >
                {option}
              </span>
            ))}
          </div>
          <div className="mt-12 mb-10 flex items-center justify-center w-full max-w-full px-2">
            <p
              className="font-bold select-none m-0 tabular-nums tracking-wider text-center min-w-[9ch]"
              style={text}
            >
              {timeLabel}
            </p>
          </div>
          <div className="px-14 sm:px-16 py-2.5 text-xl sm:text-2xl rounded-xl bg-white/90 text-gray-900 uppercase font-bold min-w-[14rem] text-center">
            Start
          </div>
        </div>
      </div>
    </div>
  );
}
