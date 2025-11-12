"use client";

import Navigation from "@/components/Navigation";
import Timer from "@/components/Timer";
import About from "@/components/About";
import Alarm from "@/components/Alarm";
import ModelSettings from "@/components/ModelSettings";
import cryptoRandomString from "crypto-random-string";
import { useUser } from "@/hooks/useUser";

import { useEffect, useRef, useState } from "react";
import { clearInterval, setInterval } from "worker-timers";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Error from "./lib/settingsError";
import { account, databases } from "./lib/appwrite";

const DATABASE_ID = "YOUR_DATABASE_ID";
const SETTINGS_COLLECTION_ID = "settings";
const USAGE_COLLECTION_ID = "useage";

export default function Home() {
  const [pomodoro, setPomodoro] = useState(25);
  const [shortBreaks, setShortBreaks] = useState(5);
  const [longBreaks, setLongBreaks] = useState(10);
  const [seconds, setSeconds] = useState(0);

  const [selected, setSelected] = useState(0);
  const [consumeSeconds, setConsumedSeconds] = useState(0);
  const [ticking, setTicking] = useState(false);
  const [isTimesUp, setIsTimesUp] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const pomodoroRef = useRef();
  const shortBreakRef = useRef();
  const longBreakRef = useRef();
  const alarmRef = useRef();

  const [user, setUser] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [usageId, setUsageId] = useState(cryptoRandomString({ length: 10, type: "alphanumeric" }));

  useEffect(() => {
    async function getUserData() {
      try {
        const userData = await account.get();
        setUser(userData);
        console.log(userData);
      } catch (error) {
        console.error("User not logged in:", error);
      }
    }
    getUserData();
  }, []);

  useEffect(() => {
    async function getUserPrefs() {
      try {
        const prefs = user.prefs || {};
        setPomodoro(prefs.pomodoro || 25);
        setShortBreaks(prefs.shortBreak || 5);
        setLongBreaks(prefs.longBreak || 10);
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    }
    getUserPrefs();
  }, [user]);

  const updateTimeDefaultValue = async () => {
    const pomodoroVal = Number(pomodoroRef.current.value);
    const shortVal = Number(shortBreakRef.current.value);
    const longVal = Number(longBreakRef.current.value);

    if (pomodoroVal < 0 || shortVal < 0 || longVal < 0) {
      console.error("Invalid values");
      return;
    }

    try {
      if (user?.$id) {
        await account.updatePrefs({
          pomodoro: pomodoroVal,
          shortBreak: shortVal,
          longBreak: longVal,
        });
      } else {
        localStorage.setItem(
          "pomodoroSettings",
          JSON.stringify({
            pomodoro: pomodoroVal,
            shortBreak: shortVal,
            longBreak: longVal,
          })
        );
      }

      setPomodoro(pomodoroVal);
      setShortBreaks(shortVal);
      setLongBreaks(longVal);
      setOpenSettings(false);
      setSeconds(0);
      setConsumedSeconds(0);
    } catch (error) {
      console.error("Error updating preferences:", error.message);
    }
  };

  const switchSelected = (index) => {
    const isYes = consumeSeconds && selected !== index ? confirm("Are you Sure") : false;
    if (isYes) {
      setConsumedSeconds(0);
      setSeconds(0);
      reset();
      setSelected(index);
      localStorage.setItem("selected", index);
    } else if (!consumeSeconds) {
      setSelected(index);
      localStorage.setItem("selected", index);
    }
  };

  const getTime = () => {
    const timeStage = {
      0: pomodoro,
      1: shortBreaks,
      2: longBreaks,
    };
    return timeStage[selected];
  };

  const updateMinute = () => {
    const updateStage = {
      0: setPomodoro,
      1: setShortBreaks,
      2: setLongBreaks,
    };
    return updateStage[selected];
  };

  const reset = () => {
    setConsumedSeconds(0);
    setTicking(false);
    setUsageId(cryptoRandomString({ length: 10, type: "alphanumeric" }));
  };

  const timesUp = async () => {
    reset();
    setIsTimesUp(true);
    setSelected(selected == 0 ? 1 : selected == 1 ? 0 : 0);
    alarmRef.current.play();
    setElapsedTime(0);
    await updateDatabase(0, true);
  };

  const updateDatabase = async (elapsedTime, completed) => {
    try {
      const existing = await databases.listDocuments(DATABASE_ID, USAGE_COLLECTION_ID, [
        { key: "user_id", value: user.$id, operator: "equal" },
        { key: "usage_id", value: usageId, operator: "equal" },
      ]);

      if (existing.documents.length > 0) {
        const doc = existing.documents[0];
        const updatedDuration = doc.duration + elapsedTime;
        await databases.updateDocument(DATABASE_ID, USAGE_COLLECTION_ID, doc.$id, {
          duration: updatedDuration,
          completed,
        });
      } else {
        await databases.createDocument(DATABASE_ID, USAGE_COLLECTION_ID, "unique()", {
          user_id: user.$id,
          usage_id: usageId,
          timestamp: new Date().toISOString(),
          duration: elapsedTime,
          completed,
        });
      }
    } catch (err) {
      console.error("Error updating usage data:", err);
    }
  };

  const clockTicking = () => {
    const minute = getTime(selected);
    const setMinute = updateMinute();

    if (minute === 0 && seconds === 0) timesUp();
    else if (seconds === 0) {
      setMinute((minute) => minute - 1);
      setSeconds(59);
    } else {
      setSeconds((seconds) => seconds - 1);
    }

    if (selected === 0) {
      setElapsedTime((prev) => prev + 1);
      if (elapsedTime % 10 === 0) {
        updateDatabase(10, false);
      }
    }
  };

  const startTimer = () => {
    setIsTimesUp(false);
    muteAlarm();
    setTicking((t) => !t);
  };

  const muteAlarm = () => {
    alarmRef.current.pause();
    alarmRef.current.currentTime = 0;
  };

  useEffect(() => {
    window.onbeforeunload = () => {
      return consumeSeconds ? "Show Warning" : null;
    };
    const timer = setInterval(() => {
      if (ticking) {
        setConsumedSeconds((v) => v + 1);
        clockTicking();
        document.title = `${getTime()}:${seconds.toString().padStart(2, "0")} - Pomopal`;
      } else {
        document.title = `Pomopal`;
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, pomodoro, shortBreaks, longBreaks, ticking]);

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-2xl min-h-screen mx-auto overflow-y-hidden">
        <Navigation setOpenSettings={setOpenSettings} />
        <Timer
          selected={selected}
          switchSelected={switchSelected}
          getTime={getTime}
          seconds={seconds}
          ticking={ticking}
          startTimer={startTimer}
          muteAlarm={muteAlarm}
          isTimesUp={isTimesUp}
          reset={reset}
        />
        <About />
        <Alarm ref={alarmRef} />
        <ModelSettings
          pomodoro={pomodoro}
          shortBreaks={shortBreaks}
          longBreaks={longBreaks}
          pomodoroRef={pomodoroRef}
          shortBreakRef={shortBreakRef}
          longBreakRef={longBreakRef}
          alarmRef={alarmRef}
          openSettings={openSettings}
          setOpenSettings={setOpenSettings}
          updateTimeDefaultValue={updateTimeDefaultValue}
        />
      </div>
      <ToastContainer position="top-right" autoClose={5000} theme="dark" />
    </div>
  );
}
