import { usePut } from "@/hooks/usePut";
import { usePost } from "@/hooks/usePost";
import { useState, useCallback } from "react";

export function useSession(userId) {
  const { submit: create } = usePost("/api/sessions");
  const { submit: update } = usePut("/api/sessions");

  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(null); // seconds
  const [selectedMode, setSelectedMode] = useState(null);

  const createSession = useCallback(
    async (mode, minutes) => {
      const now = Date.now();
      const totalSeconds = minutes * 60;

      const result = await create({
        userId,
        selected: mode,
        duration: minutes,
      });

      if (result?.sessionId) {
        setSessionId(result.sessionId);
        setStartTime(now);
        setDuration(totalSeconds);
        setSelectedMode(mode);

        localStorage.setItem(
          "activeSession",
          JSON.stringify({
            sessionId: result.sessionId,
            startTime: now,
            duration: totalSeconds,
            mode,
          })
        );
      }

      return result?.sessionId ?? null;
    },
    [userId]
  );

  const updateSession = useCallback(
    async (completed = false) => {
      if (!sessionId || !startTime) return;

      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const elapsedMin = Math.floor(elapsedSec / 60);

      await update({
        sessionId,
        actualDuration: elapsedMin,
        completed,
      });

      localStorage.setItem(
        "activeSession",
        JSON.stringify({
          sessionId,
          startTime,
          duration,
          mode: selectedMode,
        })
      );
    },
    [sessionId, startTime, duration, selectedMode]
  );

  const clearSession = useCallback(() => {
    setSessionId(null);
    setStartTime(null);
    setDuration(null);
    setSelectedMode(null);
    localStorage.removeItem("activeSession");
  }, []);

  const recoverSession = useCallback(() => {
    const saved = localStorage.getItem("activeSession");
    if (!saved) return null;

    const s = JSON.parse(saved);
    const elapsed = Math.floor((Date.now() - s.startTime) / 1000);

    if (elapsed >= s.duration) {
      clearSession();
      return null;
    }

    setSessionId(s.sessionId);
    setStartTime(s.startTime);
    setDuration(s.duration);
    setSelectedMode(s.mode);

    return {
      sessionId: s.sessionId,
      duration: s.duration,
      startTime: s.startTime,
      mode: s.mode,
      remaining: s.duration - elapsed,
    };
  }, []);

  return {
    sessionId,
    startTime,
    duration,
    selectedMode,
    createSession,
    updateSession,
    recoverSession,
    clearSession,
  };
}
