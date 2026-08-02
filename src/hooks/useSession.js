import { useState, useCallback } from "react";
import axiosClient from "@/utils/axios";

function normalizeSessionName(name) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return trimmed.slice(0, 80) || "Untitled Session";
}

export function useSession() {
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);

  const getModeType = (mode) => {
    if (mode === 0) return "pomodoro";
    if (mode === 1) return "short_break";
    return "long_break";
  };

  const createSession = useCallback(
    async (mode, minutes, userId = null, sessionContext = null, sessionName = null) => {
      const now = Date.now();
      const totalSeconds = minutes * 60;
      const name = normalizeSessionName(sessionName);

      if (!userId) {
        const guestId = `guest_${now}`;
        setSessionId(guestId);
        setStartTime(now);
        setDuration(totalSeconds);
        setSelectedMode(mode);
        localStorage.setItem(
          "activeSession",
          JSON.stringify({
            sessionId: guestId,
            startTime: now,
            duration: totalSeconds,
            mode,
            sessionName: name,
          }),
        );
        return { id: guestId, session_name: name };
      }

      try {
        const res = await axiosClient.post("/sessions", {
          type: getModeType(mode),
          planned_minutes: minutes,
          session_name: name,
          session_context: sessionContext,
        });

        if (res.data?.id) {
          setSessionId(res.data.id);
          setStartTime(now);
          setDuration(totalSeconds);
          setSelectedMode(mode);
          localStorage.setItem(
            "activeSession",
            JSON.stringify({
              sessionId: res.data.id,
              startTime: now,
              duration: totalSeconds,
              mode,
              sessionName: res.data.session_name ?? name,
            }),
          );
          return {
            id: res.data.id,
            session_name: res.data.session_name ?? name,
          };
        }

        console.error("[session] POST /sessions: no id in response", res.data);
        return null;
      } catch (err) {
        console.error(
          "[session] POST /sessions failed:",
          err?.response?.status,
          err?.response?.data ?? err.message,
        );
        return null;
      }
    },
    [],
  );

  const updateSession = useCallback(
    async (completed = false, userId = null) => {
      if (!sessionId || !startTime) return;
      if (!userId || sessionId.startsWith("guest_")) return;

      if (completed) {
        await axiosClient.patch(`/sessions/${sessionId}/complete`);
      }
      // if not completed (paused/abandoned) — no backend call needed
      // NestJS doesn't have a pause endpoint
    },
    [sessionId, startTime],
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

    try {
      const s = JSON.parse(saved);
      const elapsed = Math.floor((Date.now() - s.startTime) / 1000);

      if (elapsed >= s.duration) {
        localStorage.removeItem("activeSession");
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
        sessionName: s.sessionName ?? null,
        remaining: s.duration - elapsed,
      };
    } catch {
      localStorage.removeItem("activeSession");
      return null;
    }
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
