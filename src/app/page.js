"use client";

import Navigation from "@/components/Navigation";
import Timer from "@/components/Timer";
import About from "@/components/About";
import Alarm from "@/components/Alarm";
import ModelSettings from "@/components/ModelSettings";
import ModelStatistics from "@/components/ModelStatistics";

import { useEffect, useRef, useState } from "react";
import { clearInterval, setInterval } from "worker-timers";

import "react-toastify/dist/ReactToastify.css";

import { account, databases } from "./lib/appwrite";

const DATABASE_ID = "pomodoro_sessions_db";
const SESSIONS_COLLECTION_ID = "sessions";
const DAILY_LOGS_COLLECTION_ID = "daily_logs";

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
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const [showStats, setShowStats] = useState(false);

  // Get user data
  useEffect(() => {
    async function getUserData() {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch (error) {
        console.error("User not logged in:", error);
      }
    }
    getUserData();
  }, []);

  // Get user preferences
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

  // Session recovery on mount
  useEffect(() => {
    if (!user.$id) return;

    const savedSession = localStorage.getItem("activeSession");

    if (savedSession) {
      const session = JSON.parse(savedSession);
      const now = new Date();
      const startTime = new Date(session.startTime);
      const elapsed = (now.getTime() - startTime.getTime()) / 1000; // seconds

      // If session was started recently (within last 2 hours)
      if (elapsed < 7200 && elapsed > 0) {
        const elapsedMinutes = Math.floor(elapsed / 60);
        const shouldRecover = confirm(
          `You have an unfinished ${session.sessionType} from ${elapsedMinutes} minute(s) ago. Continue?`
        );

        if (shouldRecover) {
          // Restore session state
          setCurrentSessionId(session.sessionId);
          setSelected(session.selected);
          setElapsedTime(Math.floor(elapsed));

          // Calculate remaining time
          const totalSeconds = session.duration * 60;
          const remaining = totalSeconds - Math.floor(elapsed);

          if (remaining > 0) {
            const remainingMinutes = Math.floor(remaining / 60);
            const remainingSeconds = remaining % 60;

            if (session.selected === 0) setPomodoro(remainingMinutes);
            else if (session.selected === 1) setShortBreaks(remainingMinutes);
            else setLongBreaks(remainingMinutes);

            setSeconds(remainingSeconds);
            setTicking(true);
          } else {
            // Time already expired
            markSessionAbandoned(session.sessionId, Math.floor(elapsed));
            localStorage.removeItem("activeSession");
          }
        } else {
          // User chose to abandon
          markSessionAbandoned(session.sessionId, Math.floor(elapsed));
          localStorage.removeItem("activeSession");
        }
      } else {
        // Too old or invalid, mark as abandoned
        if (session.sessionId) {
          markSessionAbandoned(session.sessionId, 0);
        }
        localStorage.removeItem("activeSession");
      }
    }
  }, [user.$id]);

  const markSessionAbandoned = async (sessionId, actualDuration) => {
    if (!sessionId || !user.$id) return;

    try {
      await databases.updateDocument(DATABASE_ID, SESSIONS_COLLECTION_ID, sessionId, {
        endTime: new Date().toISOString(),
        actualDuration: Math.floor(actualDuration / 60), // convert to minutes
        completed: false,
      });
    } catch (error) {
      console.error("Error marking session as abandoned:", error);
    }
  };

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
      return false;
    }
    return true;
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
    setCurrentSessionId(null);
    localStorage.removeItem("activeSession");
  };

  const createSession = async () => {
    if (!user.$id) return null;

    const sessionTypeMap = {
      0: "pomodoro",
      1: "short_break",
      2: "long_break",
    };

    try {
      const session = await databases.createDocument(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        "unique()",
        {
          userId: user.$id,
          sessionType: sessionTypeMap[selected],
          duration: getTime(),
          startTime: new Date().toISOString(),
          completed: false,
        }
      );

      setCurrentSessionId(session.$id);

      // Save to localStorage
      localStorage.setItem(
        "activeSession",
        JSON.stringify({
          sessionId: session.$id,
          startTime: session.startTime,
          duration: getTime(),
          selected: selected,
          sessionType: sessionTypeMap[selected],
        })
      );

      return session.$id;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  };

  const updateSession = async (completed = false) => {
    if (!currentSessionId || !user.$id) return;

    try {
      await databases.updateDocument(DATABASE_ID, SESSIONS_COLLECTION_ID, currentSessionId, {
        endTime: new Date().toISOString(),
        actualDuration: Math.floor(elapsedTime / 60), // convert to minutes
        completed: completed,
      });
    } catch (error) {
      console.error("Error updating session:", error);
    }
  };

  const updateUserStats = async () => {
    if (!user.$id || selected !== 0) return; // Only update for pomodoros

    try {
      const prefs = user.prefs || {};
      await account.updatePrefs({
        ...prefs,
        total_pomodoros: (prefs.total_pomodoros || 0) + 1,
        total_minutes: (prefs.total_minutes || 0) + Math.floor(elapsedTime / 60),
      });
    } catch (error) {
      console.error("Error updating user stats:", error);
    }
  };

  const updateDailyLog = async () => {
    if (!user.$id) return;

    const today = new Date().toISOString().split("T")[0];

    try {
      // Check if today's log exists
      const existing = await databases.listDocuments(DATABASE_ID, DAILY_LOGS_COLLECTION_ID, [
        `userId=${user.$id}`,
        `date=${today}`,
      ]);

      const fieldMap = {
        0: "pomodorosCompleted",
        1: "shortBreaksCompleted",
        2: "longBreaksCompleted",
      };

      const field = fieldMap[selected];

      if (existing.documents.length > 0) {
        // Update existing
        const log = existing.documents[0];
        const updates = {
          [field]: (log[field] || 0) + 1,
        };

        if (selected === 0) {
          updates.totalFocusTime = (log.totalFocusTime || 0) + Math.floor(elapsedTime / 60);
        }

        await databases.updateDocument(DATABASE_ID, DAILY_LOGS_COLLECTION_ID, log.$id, updates);
      } else {
        // Create new
        const newLog = {
          userId: user.$id,
          date: today,
          pomodorosCompleted: 0,
          shortBreaksCompleted: 0,
          longBreaksCompleted: 0,
          totalFocusTime: 0,
          sessionsAbandoned: 0,
        };

        newLog[field] = 1;
        if (selected === 0) {
          newLog.totalFocusTime = Math.floor(elapsedTime / 60);
        }

        await databases.createDocument(DATABASE_ID, DAILY_LOGS_COLLECTION_ID, "unique()", newLog);
      }
    } catch (error) {
      console.error("Error updating daily log:", error);
    }
  };

  const timesUp = async () => {
    // Complete the session
    await updateSession(true);
    await updateUserStats();
    await updateDailyLog();

    reset();
    setIsTimesUp(true);
    const prefs = user.prefs || {};
    const nextStage = selected == 0 ? 1 : selected == 1 ? 0 : 0;

    setSelected(nextStage);

    setPomodoro(prefs.pomodoro || 25);
    setShortBreaks(prefs.shortBreak || 5);
    setLongBreaks(prefs.longBreak || 10);

    alarmRef.current.play();
    setElapsedTime(0);

    // Clear localStorage on completion
    localStorage.removeItem("activeSession");
  };

  const clockTicking = () => {
    const minute = getTime(selected);
    const setMinute = updateMinute();

    if (minute === 0 && seconds === 0) {
      timesUp();
    } else if (seconds === 0) {
      setMinute((minute) => minute - 1);
      setSeconds(59);
    } else {
      setSeconds((seconds) => seconds - 1);
    }

    // Track elapsed time
    setElapsedTime((prev) => prev + 1);
  };

  const startTimer = async () => {
    setIsTimesUp(false);
    muteAlarm();

    const newTicking = !ticking;
    setTicking(newTicking);

    // Create session when starting
    if (newTicking && !currentSessionId) {
      await createSession();
    }
  };

  const muteAlarm = () => {
    alarmRef.current.pause();
    alarmRef.current.currentTime = 0;
  };

  // Main timer effect
  useEffect(() => {
    // Warn before closing tab with active timer
    window.onbeforeunload = () => {
      if (consumeSeconds && ticking && selected === 0) {
        // Update localStorage with latest state
        if (currentSessionId) {
          localStorage.setItem(
            "activeSession",
            JSON.stringify({
              sessionId: currentSessionId,
              startTime: new Date(Date.now() - elapsedTime * 1000).toISOString(),
              duration: pomodoro,
              selected: selected,
              sessionType: "pomodoro",
              elapsedTime: elapsedTime,
            })
          );
        }

        return "You have an active pomodoro. Are you sure you want to leave?";
      }
      return null;
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

    return () => {
      clearInterval(timer);
    };
  }, [
    seconds,
    pomodoro,
    shortBreaks,
    longBreaks,
    ticking,
    consumeSeconds,
    elapsedTime,
    currentSessionId,
  ]);

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-2xl min-h-screen mx-auto overflow-y-hidden">
        <Navigation setOpenSettings={setOpenSettings} setShowStats={setShowStats} />
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
        <ModelStatistics openSettings={showStats} setOpenSettings={setShowStats} />
      </div>
    </div>
  );
}
