import React, { useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import Button from "./Button";
import { useUser } from "@/hooks/useUser";
import { AlertCircle, CheckCircle } from "lucide-react";
import PrivacySettings from "./PrivacySettings";
import NotificationSettings from "./NotificationSettings";
import SoundSettings from "./SoundSettings";
import AvatarSettings from "./AvatarSettings";

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
  hideChromeWhileFocusing = true,
  setHideChromeWhileFocusing,
}) {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const successTimerRef = useRef(null);

  useEffect(() => {
    if (pomodoroRef.current) pomodoroRef.current.value = pomodoro;
    if (shortBreakRef.current) shortBreakRef.current.value = shortBreaks;
    if (longBreakRef.current) longBreakRef.current.value = longBreaks;
  }, [pomodoro, shortBreaks, longBreaks, openSettings]);

  useEffect(() => {
    if (openSettings) {
      setErrors([]);
      setSuccess(false);
    }
  }, [openSettings]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current != null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

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
      if (successTimerRef.current != null) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        successTimerRef.current = null;
        setSuccess(false);
      }, 2000);
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
      className={`absolute inset-0 z-50 bg-black bg-opacity-30 ${openSettings ? "" : "hidden"}`}
    >
      <div>
        <div
          className={`p-5 rounded-md max-w-xl max-h-[90vh] overflow-y-auto bg-white absolute z-50 sm:w-86 w-11/12 left-1/2 top-1/2 ${openSettings ? "" : "hidden"}`}
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <div className="text-gray-400 flex justify-between items-center">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="w-10 h-10 rounded-full object-cover"
                src={user.avatar}
                alt={user.name || "User"}
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                {user?.name ? user.name[0].toUpperCase() : "U"}
              </span>
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
            className="w-full h-12 uppercase mt-5 rounded py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-200"
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

          <SoundSettings />

          <AvatarSettings />

          <div className="mt-5">
            <div className="h-px w-full bg-gray-200 mb-4" />
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">
                Hide UI while focusing
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={hideChromeWhileFocusing}
                onClick={() =>
                  setHideChromeWhileFocusing?.(!hideChromeWhileFocusing)
                }
                className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                  hideChromeWhileFocusing ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    hideChromeWhileFocusing ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          </div>

          <PrivacySettings />
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
}

export default React.memo(ModelSettings);
