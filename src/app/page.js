"use client";

import Navigation from "@/components/Navigation";
import Timer from "@/components/Timer";
import About from "@/components/About";
import Alarm from "@/components/Alarm";
import ModelSettings from "@/components/ModelSettings";
import ModelStatistics from "@/components/ModelStatistics";

import { useEffect, useRef, useState, useCallback } from "react";
import { clearInterval, setInterval } from "worker-timers";
import { useSession } from "@/hooks/useSession";
import { useUser } from "@/hooks/useUser";
import axiosClient from "../utils/axios";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Button from "@/components/Button";

function useTimer() {
  const [ticking, setTicking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [finished, setFinished] = useState(false);

  const begin = useCallback((startTimestamp, durationSeconds) => {
    setStartTime(startTimestamp);
    setDuration(durationSeconds);
    setRemaining(durationSeconds);
    setFinished(false);
    setTicking(true);
  }, []);

  const pause = useCallback(() => setTicking(false), []);

  const reset = useCallback(() => {
    setTicking(false);
    setStartTime(null);
    setDuration(null);
    setRemaining(null);
    setFinished(false);
  }, []);

  const getElapsedSeconds = useCallback(() => {
    if (!startTime) return 0;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (!duration) return elapsed;
    return Math.min(elapsed, duration);
  }, [startTime, duration]);

  useEffect(() => {
    if (!ticking || !startTime || !duration) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = duration - elapsed;
      if (left <= 0) {
        setRemaining(0);
        setTicking(false);
        setFinished(true);
      } else {
        setRemaining(left);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [ticking, startTime, duration]);

  return { ticking, remaining, duration, begin, pause, reset, finished, getElapsedSeconds };
}

export default function Home() {
  const { user } = useUser();
  const [selected, setSelected] = useState(0);
  const [defaults, setDefaults] = useState({ pomodoro: 25, shortBreak: 5, longBreak: 10 });
  const [openSettings, setOpenSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showRecoverDialog, setShowRecoverDialog] = useState(false);
  const [recoveredSession, setRecoveredSession] = useState(null);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [pendingSelected, setPendingSelected] = useState(null);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);

  const pomodoroRef = useRef();
  const shortBreakRef = useRef();
  const longBreakRef = useRef();
  const alarmRef = useRef();

  const { ticking, remaining, duration: timerDuration, begin, pause, reset, finished } = useTimer();
  const { sessionId, createSession, updateSession, clearSession, recoverSession } = useSession();

  const getModeDefaultMinutes = (idx = selected) => {
    if (idx === 0) return defaults.pomodoro;
    if (idx === 1) return defaults.shortBreak;
    return defaults.longBreak;
  };

  // Load settings from user prefs or localStorage
  useEffect(() => {
    if (user) {
      setDefaults({
        pomodoro: user.pomodoro_minutes || 25,
        shortBreak: user.short_break_minutes || 5,
        longBreak: user.long_break_minutes || 15,
      });
    } else {
      const stored = localStorage.getItem("pomodoroSettings");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setDefaults({
            pomodoro: parsed.pomodoro || 25,
            shortBreak: parsed.shortBreak || 5,
            longBreak: parsed.longBreak || 15,
          });
        } catch {}
      }
    }
  }, [user]);

  // Recover session on mount
  useEffect(() => {
    const recovered = recoverSession();
    if (!recovered) return;
    setSelected(recovered.mode);
    setRecoveredSession(recovered);
    setShowRecoverDialog(true);
  }, []);

  const handleRecoverSession = () => {
    if (!recoveredSession) return;
    begin(recoveredSession.startTime, recoveredSession.duration);
    setShowRecoverDialog(false);
    setRecoveredSession(null);
  };

  const handleDiscardSession = async () => {
    if (!recoveredSession) return;
    if (sessionId) await updateSession(false, user?.id);
    clearSession();
    reset();
    setShowRecoverDialog(false);
    setRecoveredSession(null);
  };

  const getTime = () => (remaining != null ? Math.floor(remaining / 60) : getModeDefaultMinutes());
  const secondsDisplay = remaining != null ? remaining % 60 : 0;

  useEffect(() => {
    if (ticking && remaining != null) {
      const mins = Math.floor(remaining / 60);
      const secs = (remaining % 60).toString().padStart(2, "0");
      document.title = `${mins}:${secs} - Pomopal`;
    } else {
      document.title = "Pomopal";
    }
  }, [ticking, remaining]);

  const handleStartOrPause = async () => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }

    if (ticking) {
      pause();
      if (sessionId) await updateSession(false, user?.id);
      return;
    }

    if (sessionId && remaining != null && timerDuration != null) {
      const newStart = Date.now() - (timerDuration - remaining) * 1000;
      begin(newStart, timerDuration);
      const savedStr = localStorage.getItem("activeSession");
      if (savedStr) {
        try {
          const parsed = JSON.parse(savedStr);
          localStorage.setItem("activeSession", JSON.stringify({ ...parsed, startTime: newStart }));
        } catch {}
      }
      return;
    }

    const minutes = getModeDefaultMinutes();
    const newId = await createSession(selected, minutes, user?.id);
    if (newId) begin(Date.now(), minutes * 60);
  };

  const handleReset = () => {
    reset();
    clearSession();
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
  };

  const handleSwitchRequest = async (idx) => {
    if (ticking) {
      setPendingSelected(idx);
      setShowSwitchDialog(true);
      return;
    }
    if (sessionId) await updateSession(false, user?.id);
    clearSession();
    reset();
    setSelected(idx);
  };

  const confirmSwitch = async () => {
    if (sessionId) await updateSession(false, user?.id);
    clearSession();
    reset();
    const idx = pendingSelected ?? 0;
    setSelected(idx);
    setPendingSelected(null);
    setShowSwitchDialog(false);
    const minutes = getModeDefaultMinutes(idx);
    const newId = await createSession(idx, minutes, user?.id);
    if (newId) begin(Date.now(), minutes * 60);
  };

  const cancelSwitch = () => {
    setPendingSelected(null);
    setShowSwitchDialog(false);
  };

  useEffect(() => {
    if (!finished) return;
    (async () => {
      const currentSessionId = sessionId;
      clearSession();
      reset();

      if (currentSessionId && !currentSessionId.startsWith("guest_") && user?.id) {
        try {
          await axiosClient.patch(`/sessions/${currentSessionId}/complete`);
        } catch (e) {
          console.error("Complete session failed:", e?.response?.data);
        }
      }

      if (alarmRef.current) alarmRef.current.play();

      const next = selected === 0 ? 1 : selected === 1 ? 2 : 0;
      setSelected(next);

      if (!autoStartBreaks) return;
      const minutes = getModeDefaultMinutes(next);
      const newId = await createSession(next, minutes, user?.id);
      if (newId) begin(Date.now(), minutes * 60);
    })();
  }, [finished, autoStartBreaks]);

  const updateTimeDefaultValue = async () => {
    const pomodoroVal = Number(pomodoroRef.current.value);
    const shortVal = Number(shortBreakRef.current.value);
    const longVal = Number(longBreakRef.current.value);

    if (
      !Number.isInteger(pomodoroVal) ||
      !Number.isInteger(shortVal) ||
      !Number.isInteger(longVal)
    ) {
      throw new Error("Values must be whole numbers.");
    }

    if (pomodoroVal < 1 || shortVal < 1 || longVal < 1) {
      throw new Error("Values must be at least 1.");
    }

    if (pomodoroVal > 120 || shortVal > 120 || longVal > 120) {
      throw new Error("Values must not exceed 120.");
    }

    if (user?.id) {
      await axiosClient.patch("/user/settings", {
        pomodoro_minutes: pomodoroVal,
        short_break_minutes: shortVal,
        long_break_minutes: longVal,
      });
    } else {
      localStorage.setItem(
        "pomodoroSettings",
        JSON.stringify({
          pomodoro: pomodoroVal,
          shortBreak: shortVal,
          longBreak: longVal,
        }),
      );
    }

    setDefaults({ pomodoro: pomodoroVal, shortBreak: shortVal, longBreak: longVal });
    handleReset();
    setSelected(0);
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-2xl min-h-screen mx-auto overflow-y-hidden">
        <Navigation setOpenSettings={setOpenSettings} setShowStats={setShowStats} />
        <Timer
          selected={selected}
          switchSelected={handleSwitchRequest}
          getTime={getTime}
          seconds={secondsDisplay}
          ticking={ticking}
          startTimer={handleStartOrPause}
          muteAlarm={() => alarmRef.current?.pause()}
          isTimesUp={false}
          reset={handleReset}
        />
        <About />
        <Alarm ref={alarmRef} />
        <ModelSettings
          pomodoro={defaults.pomodoro}
          shortBreaks={defaults.shortBreak}
          longBreaks={defaults.longBreak}
          pomodoroRef={pomodoroRef}
          shortBreakRef={shortBreakRef}
          longBreakRef={longBreakRef}
          alarmRef={alarmRef}
          openSettings={openSettings}
          setOpenSettings={setOpenSettings}
          updateTimeDefaultValue={updateTimeDefaultValue}
        />
        <ModelStatistics openSettings={showStats} setOpenSettings={setShowStats} />

        <Dialog open={showRecoverDialog} onOpenChange={setShowRecoverDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resume Previous Pomodoro?</DialogTitle>
              <DialogDescription>
                You have an unfinished session from{" "}
                {recoveredSession
                  ? Math.floor((Date.now() - recoveredSession.startTime) / 60000)
                  : 0}{" "}
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

        <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Switch Session?</DialogTitle>
              <DialogDescription>
                You have an active timer. Switching modes will pause and save the current session.
                Continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelSwitch}>
                Cancel
              </Button>
              <Button onClick={confirmSwitch}>Switch</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
