"use client";

import Navigation from "@/components/Navigation";
import Timer from "@/components/Timer";
import About from "@/components/About";
import Alarm from "@/components/Alarm";
import ModelSettings from "@/components/ModelSettings";
import ModelStatistics from "@/components/ModelStatistics";

import { useEffect, useRef, useState, useCallback } from "react";
import { clearInterval, setInterval } from "worker-timers";
import { usePost } from "@/hooks/usePost";
import { usePut } from "@/hooks/usePut";

import { incrementStreak } from "@/app/services/analytics";
import { account } from "@/app/lib/appwrite";

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
  const [startTime, setStartTime] = useState(null); // ms
  const [duration, setDuration] = useState(null); // seconds total
  const [remaining, setRemaining] = useState(null); // seconds remaining
  const [finished, setFinished] = useState(false);

  const begin = useCallback((startTimestamp, durationSeconds) => {
    setStartTime(startTimestamp);
    setDuration(durationSeconds);
    setRemaining(durationSeconds);
    setFinished(false);
    setTicking(true);
  }, []);

  const pause = useCallback(() => {
    setTicking(false);
  }, []);

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

  return {
    ticking,
    remaining,
    duration,
    begin,
    pause,
    reset,
    finished,
    getElapsedSeconds,
  };
}

function useSession(userId) {
  const { submit: create } = usePost("/api/sessions");
  const { submit: update } = usePut("/api/sessions");
  const [sessionId, setSessionId] = useState(null);

  const createSession = useCallback(
    async ({ selected, durationMinutes, startTime, durationSeconds }) => {
      if (!userId) return null;

      const result = await create({
        userId,
        selected,
        duration: durationMinutes,
      });

      if (result?.sessionId) {
        setSessionId(result.sessionId);

        localStorage.setItem(
          "activeSession",
          JSON.stringify({
            sessionId: result.sessionId,
            startTime,
            duration: durationSeconds,
            selected,
          })
        );

        return result.sessionId;
      }

      return null;
    },
    [userId]
  );

  const updateSession = useCallback(
    async ({ actualMinutes, completed }) => {
      if (!sessionId) return;

      await update({
        sessionId,
        actualDuration: actualMinutes,
        completed,
      });

      const saved = localStorage.getItem("activeSession");
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.setItem(
          "activeSession",
          JSON.stringify({
            ...parsed,
          })
        );
      }
    },
    [sessionId]
  );

  const clearSession = useCallback(() => {
    setSessionId(null);
    localStorage.removeItem("activeSession");
  }, []);

  const recoverSession = useCallback(() => {
    const savedStr = typeof window !== "undefined" ? localStorage.getItem("activeSession") : null;
    if (!savedStr) return null;

    try {
      const saved = JSON.parse(savedStr);
      if (!saved.sessionId || !saved.startTime || !saved.duration) {
        localStorage.removeItem("activeSession");
        return null;
      }

      const now = Date.now();
      const elapsed = Math.floor((now - saved.startTime) / 1000);

      if (elapsed >= saved.duration) {
        localStorage.removeItem("activeSession");
        return null;
      }

      setSessionId(saved.sessionId);

      return {
        sessionId: saved.sessionId,
        selected: saved.selected,
        startTime: saved.startTime,
        durationSeconds: saved.duration,
        elapsedSeconds: elapsed,
        remainingSeconds: saved.duration - elapsed,
      };
    } catch {
      localStorage.removeItem("activeSession");
      return null;
    }
  }, []);

  return {
    sessionId,
    createSession,
    updateSession,
    clearSession,
    recoverSession,
  };
}

export default function Home() {
  const [user, setUser] = useState({});
  const [selected, setSelected] = useState(0); // 0=pomodoro, 1=short, 2=long

  const [defaults, setDefaults] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 10,
  });

  const [openSettings, setOpenSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const [showRecoverDialog, setShowRecoverDialog] = useState(false);
  const [recoveredSession, setRecoveredSession] = useState(null);

  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [pendingSelected, setPendingSelected] = useState(null);

  const pomodoroRef = useRef();
  const shortBreakRef = useRef();
  const longBreakRef = useRef();
  const alarmRef = useRef();

  const [autoStartBreaks, setAutoStartBreaks] = useState(false);

  const {
    ticking,
    remaining,
    duration: timerDuration,
    begin,
    pause,
    reset,
    finished,
    getElapsedSeconds,
  } = useTimer();

  const { sessionId, createSession, updateSession, clearSession, recoverSession } = useSession(
    user?.$id
  );

  useEffect(() => {
    async function loadUser() {
      try {
        const u = await account.get();
        setUser(u);

        if (u?.prefs) {
          setDefaults({
            pomodoro: u.prefs.pomodoro || 25,
            shortBreak: u.prefs.shortBreak || 5,
            longBreak: u.prefs.longBreak || 10,
          });
        }
      } catch {
        // no user, try localStorage settings
        const stored =
          typeof window !== "undefined" ? localStorage.getItem("pomodoroSettings") : null;

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setDefaults({
              pomodoro: parsed.pomodoro || 25,
              shortBreak: parsed.shortBreak || 5,
              longBreak: parsed.longBreak || 10,
            });
          } catch {}
        }
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!user?.$id) return;
    const recovered = recoverSession();
    if (!recovered) return;
    setSelected(recovered.selected);
    setRecoveredSession(recovered);
    setShowRecoverDialog(true);
  }, [user?.$id]);

  const handleRecoverSession = () => {
    if (!recoveredSession) return;

    begin(recoveredSession.startTime, recoveredSession.durationSeconds);

    setShowRecoverDialog(false);
    setRecoveredSession(null);
  };

  const handleDiscardSession = async () => {
    if (!recoveredSession) return;

    const minutes = Math.floor(recoveredSession.elapsedSeconds / 60);
    if (sessionId) {
      await updateSession({ actualMinutes: minutes, completed: false });
    }

    clearSession();
    reset();
    setShowRecoverDialog(false);
    setRecoveredSession(null);
  };

  const getModeDefaultMinutes = (idx = selected) => {
    if (idx === 0) return defaults.pomodoro;
    if (idx === 1) return defaults.shortBreak;
    return defaults.longBreak;
  };

  const getTime = () => {
    if (remaining != null) {
      return Math.floor(remaining / 60);
    }
    return getModeDefaultMinutes();
  };

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
    // Stop alarm if ringing
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }

    if (ticking) {
      pause();
      if (sessionId) {
        const elapsedSec = getElapsedSeconds();
        const actualMinutes = Math.floor(elapsedSec / 60);
        await updateSession({ actualMinutes, completed: false });
      }
      return;
    }

    if (!ticking && sessionId && remaining != null && timerDuration != null) {
      const newStart = Date.now() - (timerDuration - remaining) * 1000;
      begin(newStart, timerDuration);

      const savedStr = localStorage.getItem("activeSession");
      if (savedStr) {
        try {
          const parsed = JSON.parse(savedStr);
          localStorage.setItem(
            "activeSession",
            JSON.stringify({
              ...parsed,
              startTime: newStart,
            })
          );
        } catch {}
      }
      return;
    }

    const minutes = getModeDefaultMinutes();
    const now = Date.now();
    const durationSeconds = minutes * 60;

    const newId = await createSession({
      selected,
      durationMinutes: minutes,
      startTime: now,
      durationSeconds,
    });

    if (newId) {
      begin(now, durationSeconds);
      if (selected === 0 && user?.$id) {
        await incrementStreak(user.$id);
      }
    }
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

    if (sessionId) {
      const elapsedSec = getElapsedSeconds();
      const minutes = Math.floor(elapsedSec / 60);
      if (minutes > 0) {
        await updateSession({ actualMinutes: minutes, completed: false });
      }
    }

    clearSession();
    reset();
    setSelected(idx);
  };

  const confirmSwitch = async () => {
    if (sessionId) {
      const elapsedSec = getElapsedSeconds();
      const minutes = Math.floor(elapsedSec / 60);
      if (minutes > 0) {
        await updateSession({ actualMinutes: minutes, completed: false });
      }
    }

    clearSession();
    reset();

    const idx = pendingSelected ?? 0;
    setSelected(idx);
    setPendingSelected(null);
    setShowSwitchDialog(false);

    // Auto-start new mode after switching
    const minutes = getModeDefaultMinutes(idx);
    const now = Date.now();
    const durationSeconds = minutes * 60;

    const newId = await createSession({
      selected: idx,
      durationMinutes: minutes,
      startTime: now,
      durationSeconds,
    });

    if (newId) {
      begin(now, durationSeconds);
      if (idx === 0 && user?.$id) {
        await incrementStreak(user.$id);
      }
    }
  };

  const cancelSwitch = () => {
    setPendingSelected(null);
    setShowSwitchDialog(false);
  };

  // Times Up: finalize session, reset, and cycle
  useEffect(() => {
    if (!finished) return;

    (async () => {
      const elapsedSec = getElapsedSeconds();
      const actualMinutes = Math.floor(elapsedSec / 60);

      if (sessionId) {
        await updateSession({ actualMinutes, completed: true });
      }

      if (alarmRef.current) {
        alarmRef.current.play();
      }

      clearSession();
      reset();

      // cycle pomodoro -> short -> long -> pomodoro
      const current = selected;
      const next = current === 0 ? 1 : current === 1 ? 2 : 0;

      setSelected(next);

      // 🔥 THIS IS THE AUTO-START TOGGLE
      if (!autoStartBreaks) {
        // user must press start manually
        return;
      }

      // 🔥 AUTO-START BREAK OR NEXT SESSION
      const minutes = getModeDefaultMinutes(next);
      const now = Date.now();
      const durationSeconds = minutes * 60;

      const newId = await createSession({
        selected: next,
        durationMinutes: minutes,
        startTime: now,
        durationSeconds,
      });

      if (newId) {
        begin(now, durationSeconds);

        if (next === 0 && user?.$id) {
          await incrementStreak(user.$id);
        }
      }
    })();
  }, [finished, autoStartBreaks]);

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

      // Update defaults
      setDefaults({
        pomodoro: pomodoroVal,
        shortBreak: shortVal,
        longBreak: longVal,
      });

      // reset everything when settings change
      handleReset();
      setSelected(0);
      setOpenSettings(false);
    } catch (error) {
      console.error("Error updating preferences:", error?.message || error);
    }
  };

  const isTimesUp = false; // no longer needed

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-2xl min-h-screen mx-auto overflow-y-hidden">
        <Navigation setOpenSettings={setOpenSettings} setShowStats={setShowStats} />

        <Timer
          selected={selected}
          switchSelected={(idx) => handleSwitchRequest(idx)}
          getTime={getTime}
          seconds={secondsDisplay}
          ticking={ticking}
          startTimer={handleStartOrPause}
          muteAlarm={() => alarmRef.current?.pause()}
          isTimesUp={isTimesUp}
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

        {/* Recover Dialog */}
        <Dialog open={showRecoverDialog} onOpenChange={setShowRecoverDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resume Previous Pomodoro?</DialogTitle>
              <DialogDescription>
                You have an unfinished session from{" "}
                {recoveredSession ? Math.floor(recoveredSession.elapsedSeconds / 60) : 0} minute(s)
                ago. Continue or discard it?
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

        {/* Switch Dialog */}
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
