"use client";

import dynamic from "next/dynamic";
import Navigation from "@/components/Navigation";
import Timer from "@/components/Timer";
import Footer from "@/components/Footer";
import Alarm from "@/components/Alarm";
import BackgroundAudio from "@/components/BackgroundAudio";
import SessionNamesPanel from "@/components/SessionNamesPanel";

// Memoized so the once-a-second timer tick doesn't re-render these heavy panels.
const ModelSettings = memo(dynamic(() => import("@/components/ModelSettings"), { ssr: false }));
const ModelStatistics = memo(dynamic(() => import("@/components/ModelStatistics"), { ssr: false }));
const FriendsSidebar = memo(dynamic(() => import("@/components/FriendsSidebar"), { ssr: false }));
const SpaceSettingsSidebar = memo(
  dynamic(
    () =>
      import("@/components/space/SpaceSettingsSidebar").then((m) => m.SpaceSettingsSidebar),
    { ssr: false },
  ),
);
import { memo, useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  buildBackgroundCss,
  buildTimerBoxCss,
  buildTimerTextCss,
  useSpaceStore,
} from "@/stores/useSpaceStore";
import { applyLayoutSounds } from "@/app/services/spaces";
import { useFontLibrary } from "@/hooks/useFontLibrary";
import { clearInterval, setInterval } from "worker-timers";
import { useSession } from "@/hooks/useSession";
import { useUser } from "@/hooks/useUser";
import { useSoundPreferences } from "@/hooks/useSoundPreferences";
import {
  prepareAlarmSource,
  DEFAULT_ALARM_SRC,
  MAX_ALARM_SOUND_MS,
} from "@/lib/playRingSound";
import { useMarkFocusActivity, useMarkFocusTodayLocal } from "@/hooks/useMarkFocusActivity";
import { usePresence } from "@/contexts/PresenceContext";
import axiosClient from "../utils/axios";
import {
  readUiPreferences,
  writeUiPreferences,
} from "@/lib/uiPreferences";
import {
  exitDocumentFullscreen,
  getFullscreenElement,
  requestElementFullscreen,
} from "@/lib/fullscreen";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { bgLog } from "@/lib/backgroundAudioLog";
import { SPACE_TIMER_STYLE_ENABLED, resolveTimerStyle } from "@/lib/timerStyles";
import {
  DEFAULT_LONG_BREAK_INTERVAL,
  nextInCycle,
  readCycleCount,
  readLongBreakInterval,
  writeCycleCount,
  writeLongBreakInterval,
} from "@/lib/pomodoroCycle";
import {
  cancelPauseNudge,
  ensureNotificationPermission,
  finishedCopy,
  pauseNudgeCopy,
  randomPauseNudgeDelay,
  schedulePauseNudge,
  showSystemNotification,
} from "@/lib/focusNudges";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchAudioSelection } from "@/lib/audioCache";

// `dark` rebinds the shadcn tokens so the dialog matches the dark app shell.
const DARK_DIALOG =
  "dark w-[calc(100%-2rem)] rounded-2xl border-white/10 bg-gray-900 text-white sm:rounded-2xl";
const DIALOG_PRIMARY_BTN =
  "inline-flex h-11 items-center justify-center rounded-xl bg-white text-sm font-semibold transition-colors active:scale-[0.97] px-5 text-gray-900 hover:bg-red-50 sm:h-10";
const DIALOG_SECONDARY_BTN =
  "inline-flex h-11 items-center justify-center rounded-xl text-sm font-medium transition-colors active:scale-[0.97] border border-white/20 bg-white/5 px-5 text-white hover:bg-white/10 sm:h-10";

function sessionSoundSnapshot(selection, fallback = {}) {
  if (!selection) {
    return {
      kind: "none",
      ...fallback,
    };
  }

  if (selection.kind === "youtube") {
    return {
      kind: "youtube",
      videoId: selection.videoId ?? null,
      title: selection.title ?? null,
      ...fallback,
    };
  }

  if (selection.kind === "library") {
    return {
      kind: "library",
      id: selection.id ?? null,
      name: selection.name ?? null,
      ...fallback,
    };
  }

  if (selection.kind === "default") {
    return {
      kind: "default",
      ...fallback,
    };
  }

  return {
    kind: "none",
    ...fallback,
  };
}

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

  const extend = useCallback((secondsToAdd) => {
    if (!Number.isFinite(secondsToAdd) || secondsToAdd <= 0) return;
    setDuration((d) => (d != null ? d + secondsToAdd : d));
    setRemaining((r) => (r != null ? r + secondsToAdd : r));
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
    extend,
    finished,
    getElapsedSeconds,
  };
}

export default function Home() {
  return <HomeContent />;
}

function HomeContent() {
  const { user } = useUser();
  const [selected, setSelected] = useState(0);
  const [defaults, setDefaults] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 10,
    longBreakInterval: DEFAULT_LONG_BREAK_INTERVAL,
  });
  const [cycleCount, setCycleCount] = useState(0);
  const [timerStylePref, setTimerStylePrefState] = useState("digital");
  const queryClient = useQueryClient();
  const [openSettings, setOpenSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  // Stays mounted after the first open so the sidebar can slide in and out.
  const [friendsMounted, setFriendsMounted] = useState(false);
  const [showRecoverDialog, setShowRecoverDialog] = useState(false);
  const [recoveredSession, setRecoveredSession] = useState(null);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [pendingSelected, setPendingSelected] = useState(null);
  const [sessionName, setSessionName] = useState("Untitled Session");
  const [namedSessions, setNamedSessions] = useState([]);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const [hideChromeWhileFocusing, setHideChromeWhileFocusingState] = useState(
    false,
  );
  const [hideFooter, setHideFooterState] = useState(false);
  const alarmRevokeRef = useRef(null);
  const alarmStopTimerRef = useRef(null);
  const homeMountedRef = useRef(true);
  const mainShellRef = useRef(null);
  const [pageFullscreen, setPageFullscreen] = useState(false);

  const pomodoroRef = useRef();
  const shortBreakRef = useRef();
  const longBreakRef = useRef();
  const longBreakIntervalRef = useRef();
  const alarmRef = useRef();

  useEffect(() => {
    const prefs = readUiPreferences();
    setHideChromeWhileFocusingState(Boolean(prefs.hideChromeWhileFocusing));
    setHideFooterState(Boolean(prefs.hideFooter));
    setTimerStylePrefState(prefs.timerStyle);
    setCycleCount(readCycleCount());
  }, []);

  const setTimerStylePref = useCallback((style) => {
    setTimerStylePrefState(style);
    writeUiPreferences({ ...readUiPreferences(), timerStyle: style });
  }, []);

  const setHideChromeWhileFocusing = useCallback((enabled) => {
    setHideChromeWhileFocusingState(enabled);
    writeUiPreferences({
      ...readUiPreferences(),
      hideChromeWhileFocusing: enabled,
    });
  }, []);

  const setHideFooter = useCallback((enabled) => {
    setHideFooterState(enabled);
    writeUiPreferences({
      ...readUiPreferences(),
      hideFooter: enabled,
    });
  }, []);

  const {
    ticking,
    remaining,
    duration: timerDuration,
    begin,
    pause,
    reset,
    extend,
    finished,
    getElapsedSeconds,
  } = useTimer();
  const { sessionId, createSession, updateSession, clearSession, recoverSession } = useSession();
  const markFocusActivity = useMarkFocusActivity();
  const markFocusTodayLocal = useMarkFocusTodayLocal();
  const { touchActive } = usePresence() ?? {};
  const { prefs: soundPrefs, loaded: soundPrefsLoaded, volumePreviewActive, setLivePlayback, updateBackground, updateRing } =
    useSoundPreferences();
  const heartbeatInFlightRef = useRef(false);
  const completeInFlightRef = useRef(false);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const getModeDefaultMinutes = (idx = selected) => {
    if (idx === 0) return defaults.pomodoro;
    if (idx === 1) return defaults.shortBreak;
    return defaults.longBreak;
  };

  const clearAlarmStopTimer = useCallback(() => {
    if (alarmStopTimerRef.current != null) {
      clearTimeout(alarmStopTimerRef.current);
      alarmStopTimerRef.current = null;
    }
  }, []);

  const stopAlarmPlayback = useCallback(() => {
    clearAlarmStopTimer();
    setAlarmPlaying(false);
    if (alarmRevokeRef.current) {
      alarmRevokeRef.current();
      alarmRevokeRef.current = null;
    }
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
      alarmRef.current.src = DEFAULT_ALARM_SRC;
    }
  }, [clearAlarmStopTimer]);

  const scheduleAlarmStop = useCallback(() => {
    clearAlarmStopTimer();
    alarmStopTimerRef.current = setTimeout(() => {
      stopAlarmPlayback();
    }, MAX_ALARM_SOUND_MS);
  }, [clearAlarmStopTimer, stopAlarmPlayback]);

  const buildSessionContext = useCallback(
    (mode, minutes) => ({
      timer_mode_index: mode,
      timer_mode_label:
        mode === 0 ? "pomodoro" : mode === 1 ? "short_break" : "long_break",
      timer_planned_minutes: minutes,
      background_sound: sessionSoundSnapshot(soundPrefs.background.selection, {
        enabled: Boolean(soundPrefs.background.enabled),
        volume: soundPrefs.background.volume ?? null,
      }),
      ring_sound: sessionSoundSnapshot(
        soundPrefs.ring.selection ?? { kind: "default" },
        {
          volume: soundPrefs.ring.volume ?? null,
        },
      ),
    }),
    [soundPrefs],
  );

  const rememberNamedSession = useCallback((session) => {
    if (!session?.id || session.mode !== 0) return;
    setNamedSessions((prev) => {
      if (prev.some((s) => s.id === session.id)) return prev;
      return [
        {
          id: session.id,
          session_name: session.session_name || "Untitled Session",
          started_at: session.started_at || new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }, []);

  const startFreshSession = useCallback(
    async (mode, sessionName = null) => {
      const minutes = getModeDefaultMinutes(mode);
      const created = await createSession(
        mode,
        minutes,
        user?.id,
        buildSessionContext(mode, minutes),
        sessionName,
      );
      if (!created?.id) {
        if (user?.id) {
          toast.error(
            "Could not start focus session — log in again at http://localhost:3000 and use Pomodoro mode.",
          );
        }
        return false;
      }
      begin(Date.now(), minutes * 60);
      touchActive?.();
      if (mode === 0) {
        rememberNamedSession({
          id: created.id,
          session_name: created.session_name,
          mode,
        });
      }
      return true;
    },
    [
      begin,
      buildSessionContext,
      createSession,
      getModeDefaultMinutes,
      rememberNamedSession,
      touchActive,
      user?.id,
    ],
  );

  useEffect(() => {
    if (!user?.id) {
      setNamedSessions([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await axiosClient.get("/sessions", {
          params: { limit: 30 },
        });
        if (cancelled) return;
        const today = new Date().toDateString();
        const rows = (Array.isArray(res.data) ? res.data : [])
          .filter((s) => s?.type === "pomodoro")
          .filter((s) => {
            if (!s.started_at) return false;
            return new Date(s.started_at).toDateString() === today;
          })
          .map((s) => ({
            id: s.id,
            session_name: s.session_name || "Untitled Session",
            started_at: s.started_at,
          }));
        setNamedSessions(rows);
      } catch (err) {
        console.error("Failed to load sessions:", err?.response?.data ?? err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    const state = {
      alarmRinging: alarmPlaying,
      backgroundPlaying:
        ticking &&
        selected === 0 &&
        soundPrefs.background.enabled &&
        Boolean(soundPrefs.background.selection),
    };
    bgLog("livePlayback:update", {
      ...state,
      ticking,
      selected,
      bgEnabled: soundPrefs.background.enabled,
      hasSelection: Boolean(soundPrefs.background.selection),
    });
    setLivePlayback(state);
  }, [
    alarmPlaying,
    ticking,
    selected,
    soundPrefs.background.enabled,
    soundPrefs.background.selection,
    setLivePlayback,
  ]);

  useEffect(() => {
    if (!soundPrefsLoaded) return;
    void prefetchAudioSelection(soundPrefs.background.selection);
    void prefetchAudioSelection(soundPrefs.ring.selection);
  }, [
    soundPrefsLoaded,
    soundPrefs.background.selection?.kind,
    soundPrefs.background.selection?.id,
    soundPrefs.background.selection?.videoId,
    soundPrefs.background.selection?.url,
    soundPrefs.ring.selection?.kind,
    soundPrefs.ring.selection?.id,
    soundPrefs.ring.selection?.url,
  ]);

  useEffect(() => {
    if (!ticking || !sessionId || sessionId.startsWith("guest_")) return;

    const sendHeartbeat = async () => {
      if (heartbeatInFlightRef.current) return;
      heartbeatInFlightRef.current = true;
      try {
        await axiosClient.patch(`/sessions/${sessionId}/heartbeat`, {
          elapsed_seconds: getElapsedSeconds(),
        });
        markFocusTodayLocal();
      } catch (err) {
        console.error("Heartbeat failed:", err?.response?.data);
      } finally {
        heartbeatInFlightRef.current = false;
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [ticking, sessionId, getElapsedSeconds, markFocusTodayLocal]);

  useEffect(() => {
    if (user) {
      setDefaults({
        pomodoro: user.pomodoro_minutes || 25,
        shortBreak: user.short_break_minutes || 5,
        longBreak: user.long_break_minutes || 15,
        longBreakInterval:
          user.long_break_interval ||
          readLongBreakInterval() ||
          DEFAULT_LONG_BREAK_INTERVAL,
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
            longBreakInterval:
              parsed.longBreakInterval || DEFAULT_LONG_BREAK_INTERVAL,
          });
        } catch {}
      }
    }
  }, [user]);

  useEffect(() => {
    const recovered = recoverSession();
    if (!recovered) return;
    setSelected(recovered.mode);
    setRecoveredSession(recovered);
    setShowRecoverDialog(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecoverSession = () => {
    if (!recoveredSession) return;
    begin(recoveredSession.startTime, recoveredSession.duration);
    touchActive?.();
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
    setAlarmPlaying(false);
    if (alarmRevokeRef.current) {
      alarmRevokeRef.current();
      alarmRevokeRef.current = null;
    }

    if (alarmRef.current) {
      try {
        await alarmRef.current.play();
        alarmRef.current.pause();
        alarmRef.current.currentTime = 0;
      } catch (e) {}
    }

    ensureNotificationPermission();

    if (ticking) {
      pause();
      if (sessionId) await updateSession(false, user?.id);
      if (selected === 0) void armPauseNudge();
      return;
    }

    if (sessionId && remaining != null && timerDuration != null) {
      const newStart = Date.now() - (timerDuration - remaining) * 1000;
      begin(newStart, timerDuration);
      cancelPauseNudge();
      if (!sessionId.startsWith("guest_")) {
        axiosClient.patch(`/sessions/${sessionId}/resume`).catch(() => {});
      }
      const savedStr = localStorage.getItem("activeSession");
      if (savedStr) {
        try {
          const parsed = JSON.parse(savedStr);
          localStorage.setItem("activeSession", JSON.stringify({ ...parsed, startTime: newStart }));
        } catch {}
      }
      return;
    }

    // Fresh start — pomodoro uses the inline name field
    await startFreshSession(
      selected,
      selected === 0 ? sessionName : null,
    );
  };

  /**
   * Paused a pomodoro: the backend schedules the in-app nudge (10–20 min);
   * we mirror it as a system notification at the same moment. Guests, and
   * backends without the pause endpoint, get a local-only nudge.
   */
  const armPauseNudge = async () => {
    const minutesLeft = Math.max(1, Math.ceil((remaining ?? 0) / 60));
    let nudgeAt = Date.now() + randomPauseNudgeDelay();
    let serverNudge = false;
    if (sessionId && !sessionId.startsWith("guest_") && user?.id) {
      try {
        const { data } = await axiosClient.patch(`/sessions/${sessionId}/pause`);
        // Capped or turned off server-side — stay quiet.
        if (!data?.nudge_at) return;
        nudgeAt = new Date(data.nudge_at).getTime();
        serverNudge = true;
      } catch (err) {
        if (err?.response?.status !== 404) return;
      }
    }

    // Small buffer so the server-side notification exists before we read it.
    schedulePauseNudge(nudgeAt + (serverNudge ? 5000 : 0), async () => {
      let copy = pauseNudgeCopy(minutesLeft);
      if (serverNudge) {
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
        const list = queryClient.getQueryData(["notifications", "list"]);
        const items = Array.isArray(list) ? list : list?.items;
        const latest = items?.find((n) => n.type === "focus_paused" && !n.read_at);
        // No server nudge means it was capped or turned off — stay quiet.
        if (!latest) return;
        copy = { title: latest.title, body: latest.body };
      }
      if (!showSystemNotification({ ...copy, tag: "pause-nudge" })) {
        toast(copy.body, { icon: "⏸️" });
      }
    });
  };

  const handleStartOrPauseRef = useRef(handleStartOrPause);
  handleStartOrPauseRef.current = handleStartOrPause;

  const handleReset = async () => {
    cancelPauseNudge();
    if (sessionId) await updateSession(false, user?.id);
    reset();
    clearSession();
    stopAlarmPlayback();
  };

  const handleAddMinutes = useCallback(
    (mins) => {
      if (remaining == null || remaining <= 0 || remaining > 300) return;
      if (timerDuration == null) return;

      const secondsToAdd = mins * 60;
      extend(secondsToAdd);

      const savedStr = localStorage.getItem("activeSession");
      if (savedStr) {
        try {
          const parsed = JSON.parse(savedStr);
          localStorage.setItem(
            "activeSession",
            JSON.stringify({
              ...parsed,
              duration: timerDuration + secondsToAdd,
            }),
          );
        } catch {}
      }
    },
    [remaining, timerDuration, extend],
  );

  const handleSwitchRequest = async (idx) => {
    cancelPauseNudge();
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
    await startFreshSession(idx, idx === 0 ? sessionName : null);
  };

  const cancelSwitch = () => {
    setPendingSelected(null);
    setShowSwitchDialog(false);
  };

  useEffect(() => {
    if (!finished) return;
    if (completeInFlightRef.current) return;
    completeInFlightRef.current = true;

    const snapSessionId = sessionId;
    const snapSelected = selected;
    const snapDefaults = { ...defaults };
    const snapUser = user;
    const snapAutoStart = autoStartBreaks;
    const snapRing = soundPrefs.ring;

    (async () => {
      clearSession();
      reset();

      try {
        if (snapSessionId && !snapSessionId.startsWith("guest_") && snapUser?.id) {
          await axiosClient.patch(`/sessions/${snapSessionId}/complete`);
          if (!homeMountedRef.current) return;
          markFocusActivity();
          touchActive?.();
          if (snapSelected === 0) {
            toast.success("Focus session complete — check your notifications");
          }
        }
      } catch (e) {
        if (!homeMountedRef.current) return;
        const msg =
          e?.response?.data?.message ??
          (Array.isArray(e?.response?.data?.message)
            ? e.response.data.message.join(", ")
            : null);
        console.error("Complete session failed:", e?.response?.data);
        toast.error(msg || "Could not save session — streak and notifications may not update");
      } finally {
        completeInFlightRef.current = false;
      }

      if (!homeMountedRef.current) return;

      if (alarmRevokeRef.current) {
        alarmRevokeRef.current();
        alarmRevokeRef.current = null;
      }
      clearAlarmStopTimer();

      try {
        const { src, revoke } = await prepareAlarmSource(snapRing.selection);
        if (!homeMountedRef.current) {
          revoke?.();
          return;
        }
        alarmRevokeRef.current = revoke;
        if (alarmRef.current) {
          alarmRef.current.src = src;
          alarmRef.current.volume = Math.max(
            0,
            Math.min(1, (snapRing.volume ?? 80) / 100),
          );
          alarmRef.current.load();
          await alarmRef.current.play();
          if (!homeMountedRef.current) {
            stopAlarmPlayback();
            return;
          }
          setAlarmPlaying(true);
          scheduleAlarmStop();
        }
      } catch (e) {
        console.error("Ring playback failed:", e);
        if (!homeMountedRef.current) return;
        if (alarmRef.current) {
          alarmRef.current.src = DEFAULT_ALARM_SRC;
          alarmRef.current.volume = Math.max(
            0,
            Math.min(1, (snapRing.volume ?? 80) / 100),
          );
          await alarmRef.current.play().catch(() => {});
          if (!homeMountedRef.current) {
            stopAlarmPlayback();
            return;
          }
          setAlarmPlaying(true);
          scheduleAlarmStop();
        }
      }

      if (!homeMountedRef.current) return;

      const cycle = nextInCycle(
        snapSelected,
        readCycleCount(),
        snapDefaults.longBreakInterval,
      );
      const next = cycle.next;
      writeCycleCount(cycle.count);
      setCycleCount(cycle.count);
      setSelected(next);
      showSystemNotification({
        ...finishedCopy(snapSelected, next),
        tag: "session-finished",
      });

      if (!snapAutoStart) return;
      const minutes =
        next === 0
          ? snapDefaults.pomodoro
          : next === 1
            ? snapDefaults.shortBreak
            : snapDefaults.longBreak;
      const created = await createSession(
        next,
        minutes,
        snapUser?.id,
        buildSessionContext(next, minutes),
        next === 0 ? sessionName : null,
      );
      if (!homeMountedRef.current || !created?.id) return;
      begin(Date.now(), minutes * 60);
      touchActive?.();
      if (next === 0) {
        rememberNamedSession({
          id: created.id,
          session_name: created.session_name,
          mode: next,
        });
      }
    })();
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    homeMountedRef.current = true;
    return () => {
      homeMountedRef.current = false;
      clearAlarmStopTimer();
      if (alarmRevokeRef.current) {
        alarmRevokeRef.current();
        alarmRevokeRef.current = null;
      }
    };
  }, [clearAlarmStopTimer]);

  const updateTimeDefaultValue = async () => {
    const pomodoroVal = Number(pomodoroRef.current.value);
    const shortVal = Number(shortBreakRef.current.value);
    const longVal = Number(longBreakRef.current.value);
    const intervalVal = Number(longBreakIntervalRef.current.value);

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
    if (!Number.isInteger(intervalVal) || intervalVal < 1 || intervalVal > 12) {
      throw new Error("Long break frequency must be between 1 and 12 pomodoros.");
    }

    if (user?.id) {
      await axiosClient.patch("/user/settings", {
        pomodoro_minutes: pomodoroVal,
        short_break_minutes: shortVal,
        long_break_minutes: longVal,
        // Older backends reject unknown fields; only send it when the API has it.
        ...("long_break_interval" in user ? { long_break_interval: intervalVal } : {}),
      });
      writeLongBreakInterval(intervalVal);
    } else {
      localStorage.setItem(
        "pomodoroSettings",
        JSON.stringify({
          pomodoro: pomodoroVal,
          shortBreak: shortVal,
          longBreak: longVal,
          longBreakInterval: intervalVal,
        }),
      );
    }

    setDefaults({
      pomodoro: pomodoroVal,
      shortBreak: shortVal,
      longBreak: longVal,
      longBreakInterval: intervalVal,
    });
    handleReset();
    setSelected(0);
  };

  // Stable identity so the memoized settings modal skips per-tick renders.
  const updateTimeDefaultValueRef = useRef(updateTimeDefaultValue);
  updateTimeDefaultValueRef.current = updateTimeDefaultValue;
  const saveTimeDefaults = useCallback(
    () => updateTimeDefaultValueRef.current(),
    [],
  );

  const closeFriends = useCallback(() => setShowFriends(false), []);

  useEffect(() => {
    if (showFriends) setFriendsMounted(true);
  }, [showFriends]);

  const spaceAppearance = useSpaceStore();
  const { data: customFonts = [] } = useFontLibrary(true);
  const {
    sidebarOpen,
    toggleSidebar,
  } = spaceAppearance;

  useEffect(() => {
    const blocked =
      openSettings ||
      showStats ||
      showFriends ||
      showRecoverDialog ||
      showSwitchDialog ||
      sidebarOpen;

    const onKeyDown = (e) => {
      if (blocked) return;
      if (e.key !== " " && e.key !== "Enter") return;

      const target = e.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (target.isContentEditable) return;
      }

      e.preventDefault();
      void handleStartOrPauseRef.current();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    openSettings,
    showStats,
    showFriends,
    showRecoverDialog,
    showSwitchDialog,
    sidebarOpen,
  ]);

  const exitPageFullscreen = useCallback(async () => {
    try {
      if (getFullscreenElement()) {
        await exitDocumentFullscreen();
      }
    } catch {
      // ignore
    }
    setPageFullscreen(false);
  }, []);

  const togglePageFullscreen = useCallback(async () => {
    const el = mainShellRef.current;
    if (!el) return;

    if (getFullscreenElement() === el || pageFullscreen) {
      await exitPageFullscreen();
      return;
    }

    try {
      await requestElementFullscreen(el);
      setPageFullscreen(true);
    } catch {
      setPageFullscreen(true);
    }
  }, [exitPageFullscreen, pageFullscreen]);

  useEffect(() => {
    const syncPageFullscreen = () => {
      setPageFullscreen(getFullscreenElement() === mainShellRef.current);
    };

    document.addEventListener("fullscreenchange", syncPageFullscreen);
    document.addEventListener("webkitfullscreenchange", syncPageFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncPageFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncPageFullscreen);
    };
  }, []);

  useEffect(() => {
    const blocked =
      openSettings ||
      showStats ||
      showFriends ||
      showRecoverDialog ||
      showSwitchDialog ||
      sidebarOpen;

    const onKeyDown = (e) => {
      if (blocked) return;
      if (e.key !== "f" && e.key !== "F") return;
      if (window.matchMedia("(max-width: 767px)").matches) return;

      const target = e.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (target.isContentEditable) return;
      }

      e.preventDefault();
      void togglePageFullscreen();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    openSettings,
    showStats,
    showFriends,
    showRecoverDialog,
    showSwitchDialog,
    sidebarOpen,
    togglePageFullscreen,
  ]);

  const timerBoxStyle = useMemo(
    () => buildTimerBoxCss(spaceAppearance),
    [spaceAppearance],
  );
  const timerTextStyle = useMemo(
    () => buildTimerTextCss(spaceAppearance, customFonts),
    [spaceAppearance, customFonts],
  );
  const pageBackgroundStyle = useMemo(
    () => buildBackgroundCss(spaceAppearance),
    [spaceAppearance],
  );
  const backgroundOverlayOpacity = spaceAppearance.backgroundOverlayOpacity ?? 0;

  useEffect(() => {
    if (!Array.isArray(customFonts)) return;
    for (const font of customFonts) {
      if (font?.family_name && font?.url) {
        const id = `pomopal-font-${font.family_name}`;
        if (document.getElementById(id)) continue;
        const style = document.createElement("style");
        style.id = id;
        style.textContent = `
          @font-face {
            font-family: "${font.family_name}";
            src: url("${font.url}") format("truetype");
            font-display: swap;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [customFonts]);

  // Keep live prefs in sync with the active space's default sounds.
  // Re-run whenever the space sound IDs change (e.g. after opening a shared link).
  const focusSoundId = useSpaceStore((s) => s.focusSoundId);
  const ringSoundId = useSpaceStore((s) => s.ringSoundId);
  useEffect(() => {
    if (!soundPrefsLoaded) return;
    // Don't wipe personal prefs when the active space has no sound defaults.
    if (!focusSoundId && !ringSoundId) return;
    applyLayoutSounds(
      { focusSoundId, ringSoundId },
      { updateBackground, updateRing },
      { clearMissing: false },
    );
  }, [
    soundPrefsLoaded,
    focusSoundId,
    ringSoundId,
    updateBackground,
    updateRing,
  ]);

  const hideNavFooter =
    sidebarOpen || (ticking && hideChromeWhileFocusing) || pageFullscreen;
  const hideFooterBar = hideFooter || hideNavFooter;
  const hideSessionTabs = ticking && hideChromeWhileFocusing;
  const timerStyle = resolveTimerStyle(
    SPACE_TIMER_STYLE_ENABLED ? spaceAppearance.timerStyle : null,
    timerStylePref,
  );
  const totalSeconds = timerDuration ?? getModeDefaultMinutes() * 60;
  const timerProgress =
    remaining != null && totalSeconds > 0 ? remaining / totalSeconds : 1;
  const longBreakEvery = defaults.longBreakInterval || DEFAULT_LONG_BREAK_INTERVAL;

  return (
    <>
      <div
        ref={mainShellRef}
        className="relative flex h-dvh overflow-x-hidden bg-gray-900 [&:fullscreen]:flex [&:fullscreen]:h-full [&:fullscreen]:w-full [&:fullscreen]:bg-gray-900 [&:-webkit-full-screen]:flex [&:-webkit-full-screen]:h-full [&:-webkit-full-screen]:w-full"
        style={pageBackgroundStyle}
      >
        {backgroundOverlayOpacity > 0 ? (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundColor: `rgba(0,0,0,${backgroundOverlayOpacity / 100})`,
            }}
            aria-hidden
          />
        ) : null}
        <div
          className={`relative z-[1] flex h-full min-w-0 flex-1 flex-col overflow-visible transition-[margin] duration-200 ease-in-out ${
            showFriends ? "md:mr-60" : ""
          }`}
        >
          <div
            className={`relative z-30 mx-auto w-full max-w-2xl shrink-0 transition-all duration-500 ease-in-out ${
              hideNavFooter
                ? "pointer-events-none max-h-0 -translate-y-2 overflow-hidden opacity-0"
                : "max-h-40 translate-y-0 overflow-visible pb-1 opacity-100"
            }`}
            aria-hidden={hideNavFooter}
          >
            <Navigation
              setOpenSettings={setOpenSettings}
              setShowStats={setShowStats}
              showFriends={showFriends}
              setShowFriends={setShowFriends}
              onOpenSpaceSettings={toggleSidebar}
              spaceSettingsOpen={sidebarOpen}
              pageFullscreen={pageFullscreen}
              onTogglePageFullscreen={togglePageFullscreen}
            />
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <Timer
              selected={selected}
              switchSelected={handleSwitchRequest}
              getTime={getTime}
              seconds={secondsDisplay}
              ticking={ticking}
              hideSessionTabs={hideSessionTabs}
              onPlayPause={handleStartOrPause}
              onReset={handleReset}
              remainingSeconds={remaining}
              onAddMinutes={handleAddMinutes}
              canReset={
                ticking || remaining != null || alarmPlaying || Boolean(sessionId)
              }
              muteAlarm={stopAlarmPlayback}
              isTimesUp={alarmPlaying}
              boxStyle={timerBoxStyle}
              textStyle={timerTextStyle}
              sessionName={sessionName}
              onSessionNameChange={setSessionName}
              sessionNameDisabled={Boolean(sessionId) || ticking}
              pageFullscreen={pageFullscreen}
              onExitPageFullscreen={exitPageFullscreen}
              timerStyle={timerStyle}
              progress={timerProgress}
              totalSeconds={totalSeconds}
              hasStarted={remaining != null}
              cycleDone={cycleCount % longBreakEvery}
              cycleTotal={longBreakEvery}
            />
            <SessionNamesPanel sessions={namedSessions} />
          </div>

          <div
            className={`relative z-10 mx-auto w-full max-w-2xl shrink-0 overflow-hidden transition-all duration-500 ease-in-out ${
              hideFooterBar
                ? "pointer-events-none max-h-0 translate-y-2 opacity-0"
                : "max-h-24 translate-y-0 opacity-100"
            }`}
            aria-hidden={hideFooterBar}
          >
            <Footer compact />
          </div>
        </div>

        {friendsMounted && (
          <FriendsSidebar open={showFriends} onClose={closeFriends} />
        )}
        <SpaceSettingsSidebar />
      </div>

      <Alarm ref={alarmRef} />
      {soundPrefsLoaded && (
        <BackgroundAudio
          enabled={soundPrefs.background.enabled}
          volume={soundPrefs.background.volume}
          selection={soundPrefs.background.selection}
          shouldPlay={ticking && selected === 0}
          previewActive={volumePreviewActive}
        />
      )}
      <ModelSettings
        pomodoro={defaults.pomodoro}
        shortBreaks={defaults.shortBreak}
        longBreaks={defaults.longBreak}
        pomodoroRef={pomodoroRef}
        shortBreakRef={shortBreakRef}
        longBreakRef={longBreakRef}
        longBreakInterval={defaults.longBreakInterval}
        longBreakIntervalRef={longBreakIntervalRef}
        timerStyle={timerStylePref}
        setTimerStyle={setTimerStylePref}
        spaceTimerStyle={
          SPACE_TIMER_STYLE_ENABLED ? (spaceAppearance.timerStyle ?? null) : null
        }
        alarmRef={alarmRef}
        openSettings={openSettings}
        setOpenSettings={setOpenSettings}
        updateTimeDefaultValue={saveTimeDefaults}
        hideChromeWhileFocusing={hideChromeWhileFocusing}
        setHideChromeWhileFocusing={setHideChromeWhileFocusing}
        hideFooter={hideFooter}
        setHideFooter={setHideFooter}
      />
      <ModelStatistics openSettings={showStats} setOpenSettings={setShowStats} />

      <Dialog open={showRecoverDialog} onOpenChange={setShowRecoverDialog}>
        <DialogContent className={DARK_DIALOG}>
          <DialogHeader>
            <DialogTitle>Resume previous pomodoro?</DialogTitle>
            <DialogDescription>
              You have an unfinished session from{" "}
              {recoveredSession
                ? Math.floor((Date.now() - recoveredSession.startTime) / 60000)
                : 0}{" "}
              minute(s) ago. Continue or discard it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button type="button" className={DIALOG_SECONDARY_BTN} onClick={handleDiscardSession}>
              Discard
            </button>
            <button type="button" className={DIALOG_PRIMARY_BTN} onClick={handleRecoverSession}>
              Continue
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent className={DARK_DIALOG}>
          <DialogHeader>
            <DialogTitle>Switch session?</DialogTitle>
            <DialogDescription>
              You have an active timer. Switching modes will pause and save the current session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button type="button" className={DIALOG_SECONDARY_BTN} onClick={cancelSwitch}>
              Cancel
            </button>
            <button type="button" className={DIALOG_PRIMARY_BTN} onClick={confirmSwitch}>
              Switch
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
