"use client";

import Navigation from "@/components/Navigation";
import Timer from "@/components/Timer";
import About from "@/components/About";
import Alarm from "@/components/Alarm";
import ModelSettings from "@/components/ModelSettings";

import { useEffect, useRef, useState } from "react";
import { clearInterval, setInterval } from "worker-timers";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Error from "./lib/settingsError";

import supabase from "./lib/supabase";

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
  const [settings, setSettings] = useState();

  useEffect(() => {
    async function getUserData() {
      await supabase.auth.getUser().then(async (value) => {
        if (value.data?.user) {
          setUser(value.data.user);
        }
      });
    }

    getUserData();
  }, []);

  useEffect(() => {
    async function getSettings() {
      if (Object.keys(user).length !== 0) {
        const { data: settingsData, error: settingsError } = await supabase
          .from("settings")
          .select("*")
          .eq("user_id", user.id);

        if (settingsError) {
          console.error("Error fetching settings data:", settingsError.message);
          return;
        }

        if (settingsData.length > 0) {
          console.log("Settings data:", settingsData[0]);
          setPomodoro(settingsData[0].work_duration);
          setShortBreaks(settingsData[0].break_duration);
          setLongBreaks(settingsData[0].long_break_duration);
        }
      }
    }
    getSettings();
  }, [user]);

  const updateTimeDefaultValue = async () => {
    if (
      pomodoroRef.current.value < 0 ||
      shortBreakRef.current.value < 0 ||
      shortBreakRef.current.value < 0
    )
      return Error("Something went wrong");
    const { data } = await supabase
      .from("settings")
      .update({
        work_duration: pomodoroRef.current.value,
        break_duration: shortBreakRef.current.value,
        long_break_duration: longBreakRef.current.value,
      })
      .eq("user_id", user.id);

    if (error) {
      Error("Error updating settings:", error.message);
    } else {
      console.log("Settings updated successfully:", data);
    }
    setPomodoro(pomodoroRef.current.value);
    setShortBreaks(shortBreakRef.current.value);
    setLongBreaks(longBreakRef.current.value);

    localStorage.setItem("pomodoro", pomodoroRef.current.value);
    localStorage.setItem("shortBreaks", shortBreakRef.current.value);
    localStorage.setItem("longBreaks", longBreakRef.current.value);
    setOpenSettings(false);
    setSeconds(0);
    setConsumedSeconds(0);
  };

  const switchSelected = (index) => {
    const isYes = consumeSeconds && selected !== index ? confirm("Are you Sure") : false;
    if (isYes) {
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
    updateTimeDefaultValue();
  };

  const timesUp = () => {
    reset();
    setIsTimesUp(true);
    setSelected(selected == 0 ? 1 : selected == 1 ? 0 : 0);
    alarmRef.current.play();
  };

  const clockTicking = () => {
    const minute = getTime(selected);
    const setMinute = updateMinute();

    if (minute === 0 && seconds === 0) timesUp();
    else if (seconds == 0) {
      setMinute((minute) => minute - 1);
      setSeconds(59);
    } else {
      setSeconds((seconds) => seconds - 1);
    }
  };

  const startTimer = () => {
    setIsTimesUp(false);
    muteAlarm();
    setTicking((ticking) => !ticking);
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
        setConsumedSeconds((value) => value + 1);
        clockTicking();
        document.title = `${getTime()}:${
          parseInt(seconds.toString().padStart(2, "0") - 1) < 0
            ? seconds.toString().padStart(2, "0")
            : seconds.toString().padStart(2, "0") - 1
        } - Pomopal`;
      } else {
        document.title = `Pomopal`;
      }
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [seconds, pomodoro, shortBreaks, longBreaks, ticking]);

  // useEffect(() => {
  //   const storedPomodoro = localStorage.getItem("pomodoro");
  //   const storedShortBreaks = localStorage.getItem("shortBreaks");
  //   const storedLongBreaks = localStorage.getItem("longBreaks");
  //   const storedSelected = localStorage.getItem("selected");

  //   // if (storedPomodoro) setPomodoro(Number(storedPomodoro));
  //   // if (storedShortBreaks) setShortBreaks(Number(storedShortBreaks));
  //   // if (storedLongBreaks) setLongBreaks(Number(storedLongBreaks));
  //   // if (storedSelected) setSelected(Number(storedSelected));
  // }, []);

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
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}
