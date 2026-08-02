import { Pause, Play, RotateCcw } from "lucide-react";

export default function PomodoroTimer({
  selected,
  switchSelected,
  getTime,
  seconds,
  ticking,
  hideSessionTabs = false,
  onPlayPause,
  onReset,
  canReset = false,
  isTimesUp,
  muteAlarm,
  boxStyle,
  textStyle,
  sessionName = "Untitled Session",
  onSessionNameChange,
  sessionNameDisabled = false,
}) {
  const options = ["Pomodoro", "Short Break", "Long Break"];
  const mins = String(getTime()).padStart(2, "0");
  const secs = String(seconds).padStart(2, "0");
  const showNameInput = selected === 0;

  return (
    <div
      className="pointer-events-auto absolute inset-0 z-[1] flex min-h-0 items-center justify-center overflow-hidden px-3 py-2 sm:px-4"
    >
      <div
        className="flex max-h-full w-full max-w-lg flex-col items-center justify-center overflow-hidden text-white"
        style={{ ...boxStyle, maxHeight: "100%" }}
      >
        <div
          className={`flex max-w-full flex-wrap justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-0.5 transition-all duration-500 ease-in-out sm:gap-2 sm:p-1 ${
            hideSessionTabs
              ? "pointer-events-none max-h-0 -translate-y-2 scale-95 overflow-hidden border-transparent bg-transparent p-0 opacity-0"
              : "max-h-20 translate-y-0 scale-100 opacity-100"
          }`}
          aria-hidden={hideSessionTabs}
        >
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              tabIndex={hideSessionTabs ? -1 : 0}
              className={`rounded-xl px-2.5 py-1.5 text-xs transition-all sm:px-4 sm:py-2 sm:text-base ${
                index === selected
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
              onClick={() => switchSelected(index)}
            >
              {option}
            </button>
          ))}
        </div>

        <div
          className={`group/name w-full max-w-[12rem] transition-all duration-500 ease-in-out sm:max-w-[14rem] ${
            showNameInput && !ticking
              ? "mt-2 max-h-8 translate-y-0 opacity-100"
              : "pointer-events-none mt-0 max-h-0 -translate-y-1 overflow-hidden opacity-0"
          }`}
          aria-hidden={!showNameInput || ticking}
        >
          <input
            type="text"
            value={sessionName === "Untitled Session" ? "" : sessionName}
            maxLength={80}
            disabled={sessionNameDisabled || !showNameInput || ticking}
            tabIndex={showNameInput && !ticking && !sessionNameDisabled ? 0 : -1}
            placeholder="Untitled Session"
            aria-label="Session name"
            onChange={(e) =>
              onSessionNameChange?.(e.target.value || "Untitled Session")
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !ticking && !sessionNameDisabled) {
                e.preventDefault();
                onPlayPause?.();
              }
            }}
            className="h-7 w-full border-0 bg-transparent px-1 text-center text-[11px] tracking-wide text-white/55 placeholder:text-white/20 outline-none transition duration-200 hover:text-white/70 hover:placeholder:text-white/35 focus:text-white/85 focus:placeholder:text-white/40 disabled:cursor-default disabled:opacity-50"
          />
        </div>

        <div
          className={`flex w-full max-w-full items-center justify-center px-2 transition-all duration-500 ease-in-out ${
            hideSessionTabs ? "my-2 sm:my-4" : "my-4 sm:my-8 md:my-10"
          }`}
        >
          <p
            className="m-0 max-w-full min-w-[7ch] select-none text-center font-bold tabular-nums tracking-wider sm:min-w-[9ch] md:min-w-[10ch]"
            style={textStyle}
            aria-live="polite"
          >
            {mins}:{secs}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onPlayPause}
              aria-label={ticking ? "Pause" : "Play"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gray-900 shadow-lg shadow-black/25 transition-all hover:bg-red-50 active:scale-[0.96] sm:h-14 sm:w-14"
            >
              {ticking ? (
                <Pause
                  className="h-5 w-5 fill-current sm:h-6 sm:w-6"
                  strokeWidth={0}
                />
              ) : (
                <Play
                  className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6"
                  strokeWidth={0}
                />
              )}
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={!canReset}
              aria-label="Reset"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-35 sm:h-14 sm:w-14"
            >
              <RotateCcw
                className="h-4 w-4 sm:h-5 sm:w-5"
                strokeWidth={2.25}
              />
            </button>
          </div>
          {isTimesUp && (
            <button
              type="button"
              className="text-sm text-white/70 underline"
              onClick={muteAlarm}
            >
              Mute
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
