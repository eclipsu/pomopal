import { useState, useEffect, useCallback } from "react";
import { clearInterval, setInterval } from "worker-timers";

export function useTimer() {
  const [ticking, setTicking] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(null);

  const start = useCallback((timestamp, totalSeconds) => {
    setStartTime(timestamp);
    setDuration(totalSeconds);
    setRemaining(totalSeconds);
    setTicking(true);
  }, []);

  const pause = useCallback(() => {
    setTicking(false);
  }, []);

  const reset = useCallback(() => {
    setTicking(false);
    setRemaining(null);
    setDuration(null);
    setStartTime(null);
  }, []);

  const getElapsedSeconds = useCallback(() => {
    if (!startTime || !duration) return 0;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.min(elapsed, duration);
  }, [startTime, duration]);

  useEffect(() => {
    if (!ticking || !startTime || !duration) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = duration - elapsed;

      if (left <= 0) {
        setRemaining(0);
        setTicking(false);
      } else {
        setRemaining(left);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [ticking, startTime, duration]);

  return {
    ticking,
    remaining,
    start,
    pause,
    reset,
    getElapsedSeconds,
  };
}
