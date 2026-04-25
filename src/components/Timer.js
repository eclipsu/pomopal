import { useUser } from "@/hooks/useUser";
import { FiBellOff } from "react-icons/fi";

export default function PomodoroTimer({
  selected,
  switchSelected,
  getTime,
  seconds,
  ticking,
  startTimer,
  isTimesUp,
  muteAlarm,
  reset,
}) {
  const { user } = useUser();
  const options = ["Pomodoro", "Short Break", "Long Break"];

  return (
    <div className="text-white w-10/12 mx-auto pt-5 flex flex-col justify-center items-center mt-10 overflow-y-hidden">
      <div className="flex gap-5 items-center">
        {options.map((option, index) => (
          <h1
            key={index}
            className={`${index === selected ? "bg-gray-500 bg-opacity-30" : ""} p-1 cursor-pointer transition-all rounded`}
            onClick={() => switchSelected(index)}
          >
            {option}
          </h1>
        ))}
      </div>

      <div className="mt-10 mb-10">
        <h1 className="text-8xl font-bold select-none m-0">
          {getTime()}:{seconds.toString().padStart(2, "0")}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={startTimer}
          className="px-16 py-2 text-2xl rounded-md bg-white text-blue-500 uppercase font-bold w-56"
        >
          {ticking ? "Pause" : "Start"}
        </button>
        {isTimesUp && (
          <FiBellOff className="text-3xl text-white cursor-pointer" onClick={muteAlarm} />
        )}
      </div>
    </div>
  );
}
