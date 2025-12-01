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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Button from "@/components/Button";

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
  const [showStats, setShowStats] = useState(false);

  const pomodoroRef = useRef();
  const shortBreakRef = useRef();
  const longBreakRef = useRef();
  const alarmRef = useRef();

  const [user, setUser] = useState({});
  const [elapsedTime, setElapsedTime] = useState(0); // seconds
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Recovery dialog state
  const [showRecoverDialog, setShowRecoverDialog] = useState(false);
  const [recoveredSession, setRecoveredSession] = useState(null);

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

  // Session recovery
  useEffect(() => {
    if (!user.$id) return;

    const savedSession = localStorage.getItem("activeSession");

    if (savedSession) {
      const session = JSON.parse(savedSession);
      const now = new Date();
      const startTime = new Date(session.startTime);
      const elapsed = (now.getTime() - startTime.getTime()) / 1000;

      if (elapsed < 7200 && elapsed > 0) {
        setRecoveredSession({ ...session, elapsed });
        setShowRecoverDialog(true);
      } else {
        if (session.sessionId) markSessionAbandoned(session.sessionId, 0);
        localStorage.removeItem("activeSession");
      }
    }
  }, [user.$id]);

  const handleRecoverSession = () => {
    if (!recoveredSession) return;
    const session = recoveredSession;
    const totalSeconds = session.duration * 60;
    const remaining = totalSeconds - Math.floor(session.elapsed);

    setCurrentSessionId(session.sessionId);
    setSelected(session.selected);
    setElapsedTime(Math.floor(session.elapsed));

    if (remaining > 0) {
      const remainingMinutes = Math.floor(remaining / 60);
      const remainingSeconds = remaining % 60;
      if (session.selected === 0) setPomodoro(remainingMinutes);
      else if (session.selected === 1) setShortBreaks(remainingMinutes);
      else setLongBreaks(remainingMinutes);

      setSeconds(remainingSeconds);
      setTicking(true);
    } else {
      markSessionAbandoned(session.sessionId, Math.floor(session.elapsed));
      localStorage.removeItem("activeSession");
    }

    setShowRecoverDialog(false);
    setRecoveredSession(null);
  };

  const handleDiscardSession = () => {
    if (!recoveredSession) return;
    markSessionAbandoned(recoveredSession.sessionId, Math.floor(recoveredSession.elapsed));
    localStorage.removeItem("activeSession");
    setShowRecoverDialog(false);
    setRecoveredSession(null);
  };

  const markSessionAbandoned = async (sessionId, actualDurationSeconds) => {
    if (!sessionId || !user.$id) return;

    try {
      await databases.updateDocument(DATABASE_ID, SESSIONS_COLLECTION_ID, sessionId, {
        endTime: new Date().toISOString(),
        actualDuration: Math.floor(actualDurationSeconds / 60),
        completed: false,
      });
    } catch (error) {
      console.error("Error marking session as abandoned:", error);
    }
  };

  const getTime = () => {
    const map = { 0: pomodoro, 1: shortBreaks, 2: longBreaks };
    return map[selected];
  };

  const updateMinute = () => {
    const map = { 0: setPomodoro, 1: setShortBreaks, 2: setLongBreaks };
    return map[selected];
  };

  const reset = () => {
    setConsumedSeconds(0);
    setTicking(false);
    setCurrentSessionId(null);
    setElapsedTime(0);
    localStorage.removeItem("activeSession");
  };

  const createSession = async () => {
    if (!user.$id) return null;
    const sessionTypeMap = { 0: "pomodoro", 1: "short_break", 2: "long_break" };

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
      localStorage.setItem(
        "activeSession",
        JSON.stringify({
          sessionId: session.$id,
          startTime: new Date().toISOString(),
          duration: getTime(),
          selected,
          sessionType: sessionTypeMap[selected],
          remainingSeconds: getTime() * 60,
        })
      );

      setElapsedTime(0);
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
        actualDuration: Math.floor(elapsedTime / 60),
        completed,
      });
    } catch (error) {
      console.error("Error updating session:", error);
    }
  };

  const incrementStreak = async () => {
    try {
      let existing;

      try {
        existing = await databases.getDocument("pomodoro_sessions_db", "analytics", user.$id);
      } catch (_) {
        await databases.createDocument("pomodoro_sessions_db", "analytics", user.$id, {
          userId: user.$id,
          streak: 1,
          hours_focused: 0,
          lastActiveDate: new Date().toISOString(),
        });
        return;
      }

      await databases.updateDocument("pomodoro_sessions_db", "analytics", user.$id, {
        streak: existing.streak + 1,
        lastActiveDate: new Date().toISOString().split("T")[0],
      });
    } catch (e) {
      console.error("Streak update failed:", e);
    }
  };

  const clockTicking = () => {
    const minute = getTime();
    const setMinute = updateMinute();

    if (minute === 0 && seconds === 0) timesUp();
    else if (seconds === 0) {
      setMinute((minute) => minute - 1);
      setSeconds(59);
    } else setSeconds((seconds) => seconds - 1);

    setElapsedTime((prev) => prev + 1);
  };

  const startTimer = async () => {
    setIsTimesUp(false);
    alarmRef.current.pause();
    alarmRef.current.currentTime = 0;

    const newTicking = !ticking;
    setTicking(newTicking);

    if (newTicking && !currentSessionId) {
      if (selected === 0) await incrementStreak();
      await createSession();
    }

    if (!newTicking && currentSessionId) {
      await updateSession(false);
      localStorage.removeItem("activeSession");
      setCurrentSessionId(null);
      setElapsedTime(0);
    }
  };

  const timesUp = async () => {
    await updateSession(true);
    reset();
    setIsTimesUp(true);
    alarmRef.current.play();
    setElapsedTime(0);
    localStorage.removeItem("activeSession");
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (ticking) {
        setConsumedSeconds((v) => v + 1);
        clockTicking();
        document.title = `${getTime()}:${seconds.toString().padStart(2, "0")} - Pomopal`;
      } else document.title = `Pomopal`;
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, ticking]);

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-2xl min-h-screen mx-auto overflow-y-hidden">
        <Navigation setOpenSettings={setOpenSettings} setShowStats={setShowStats} />
        <Timer
          selected={selected}
          switchSelected={(idx) => setSelected(idx)}
          getTime={getTime}
          seconds={seconds}
          ticking={ticking}
          startTimer={startTimer}
          muteAlarm={() => alarmRef.current.pause()}
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
          updateTimeDefaultValue={() => {}}
        />
        <ModelStatistics openSettings={showStats} setOpenSettings={setShowStats} />

        {/* Recovery Dialog */}
        <Dialog open={showRecoverDialog} onOpenChange={setShowRecoverDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resume Previous Pomodoro?</DialogTitle>
              <DialogDescription>
                You have an unfinished session from {Math.floor(recoveredSession?.elapsed / 60)}{" "}
                minute(s) ago. Continue or discard it?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleDiscardSession}>
                Discard
              </Button>
              <Button onClick={handleRecoverSession}>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
