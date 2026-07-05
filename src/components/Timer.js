export default function PomodoroTimer({
  selected,
  switchSelected,
  getTime,
  seconds,
  ticking,
  startTimer,
  isTimesUp,
  muteAlarm,
}) {
  const options = ["Pomodoro", "Short Break", "Long Break"];
  const mins = String(getTime()).padStart(2, "0");
  const secs = String(seconds).padStart(2, "0");

  return (
    <div className="text-white w-full max-w-lg mx-auto px-4 pt-8 flex flex-col justify-center items-center overflow-x-hidden">
      <div className="flex flex-wrap justify-center gap-1 sm:gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 max-w-full">
        {options.map((option, index) => (
          <button
            key={option}
            type="button"
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-xl transition-all ${
              index === selected
                ? "bg-white/15 text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
            onClick={() => switchSelected(index)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="mt-12 mb-10 flex items-center justify-center w-full max-w-full px-2">
        <p
          className="text-[clamp(3rem,16vw,6rem)] font-bold select-none m-0 tabular-nums tracking-wider text-center min-w-[9ch] sm:min-w-[10ch] md:min-w-[12ch] max-w-full"
          aria-live="polite"
        >
          {mins}:{secs}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={startTimer}
          className="px-14 sm:px-16 py-2.5 text-xl sm:text-2xl rounded-xl bg-white text-gray-900 uppercase font-bold min-w-[14rem] hover:bg-red-50 active:scale-[0.98] transition-all"
        >
          {ticking ? "Pause" : "Start"}
        </button>
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
  );
}
