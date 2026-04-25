import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import Image from "next/image";
import Button from "./Button";
import { useUser } from "@/hooks/useUser";
import { AlertCircle, CheckCircle } from "lucide-react";

function ModelSettings({
  pomodoro,
  shortBreaks,
  longBreaks,
  pomodoroRef,
  shortBreakRef,
  longBreakRef,
  setOpenSettings,
  openSettings,
  updateTimeDefaultValue,
}) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (pomodoroRef.current) pomodoroRef.current.value = pomodoro;
    if (shortBreakRef.current) shortBreakRef.current.value = shortBreaks;
    if (longBreakRef.current) longBreakRef.current.value = longBreaks;
  }, [pomodoro, shortBreaks, longBreaks, openSettings]);

  // Reset state when modal opens
  useEffect(() => {
    if (openSettings) {
      setErrors([]);
      setSuccess(false);
    }
  }, [openSettings]);

  const formatError = (msg) => {
    return msg.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };
  const handleUpdate = async () => {
    setErrors([]);
    setSuccess(false);
    try {
      setIsLoading(true);
      await updateTimeDefaultValue();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      const msgs = err?.response?.data?.message;
      if (Array.isArray(msgs)) {
        setErrors(msgs.map(formatError));
      } else if (typeof msgs === "string") {
        setErrors([formatError(msgs)]);
      } else {
        setErrors([err?.message || "Unknown error"]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputs = [
    { label: "Pomodoro", ref: pomodoroRef },
    { label: "Short Break", ref: shortBreakRef },
    { label: "Long Break", ref: longBreakRef },
  ];

  return (
    <div
      className={`absolute h-full w-full left-0 top-0 bg-black bg-opacity-30 ${openSettings ? "" : "hidden"}`}
    >
      <div>
        <div
          className={`p-5 rounded-md max-w-xl bg-white absolute sm:w-86 w-11/12 left-1/2 top-1/2 ${openSettings ? "" : "hidden"}`}
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <div className="text-gray-400 flex justify-between items-center">
            {user?.avatar && (
              <Image
                width={500}
                height={500}
                className="w-10 h-10 rounded-full object-cover"
                src={user.avatar}
                alt={user.name || "User"}
              />
            )}
            <h1 className="uppercase font-bold tracking-wider">
              {user?.name || "User"}'s SETTINGS
            </h1>
            <FiX className="text-2xl cursor-pointer" onClick={() => setOpenSettings(false)} />
          </div>

          <div className="h-1 w-full bg-gray-400 my-5"></div>

          <div className="flex gap-5">
            {inputs.map((input, index) => (
              <div key={index}>
                <h1 className="text-gray-400 text-sm">{input.label}</h1>
                <input
                  ref={input.ref}
                  type="number"
                  className="w-full bg-gray-400 bg-opacity-30 py-2 rounded outline-none text-center"
                />
              </div>
            ))}
          </div>

          {/* Error messages */}
          {errors.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <ul className="space-y-1">
                  {errors.map((err, i) => (
                    <li key={i} className="text-red-600 text-sm">
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-green-600 text-sm">Settings updated successfully.</p>
              </div>
            </div>
          )}

          <Button
            type="button"
            disabled={isLoading}
            className="w-full h-12 uppercase mt-5 rounded py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
            onClick={handleUpdate}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating Settings
              </div>
            ) : (
              <div className="flex items-center gap-2">Update Settings</div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ModelSettings);
