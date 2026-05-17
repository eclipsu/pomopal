"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useUser } from "@/hooks/useUser";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const PresenceContext = createContext(null);

function presenceEquals(a, b) {
  if (!a || !b) return false;
  return (
    a.status === b.status &&
    a.custom_status === b.custom_status &&
    a.current_activity === b.current_activity
  );
}

export function PresenceProvider({ children }) {
  const { user } = useUser();
  const userId = user?.id;
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const [presenceMap, setPresenceMap] = useState({});

  const updatePresence = useCallback((data) => {
    if (!data?.userId) return;
    setPresenceMap((prev) => {
      const existing = prev[data.userId];
      if (presenceEquals(existing, data)) return prev;
      return { ...prev, [data.userId]: data };
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      setPresenceMap({});
      return;
    }

    let cancelled = false;

    const onChanged = (data) => updatePresence(data);
    const onUpdated = (data) => updatePresence(data);
    const onActivity = ({ userId: uid, current_activity }) => {
      if (!uid) return;
      setPresenceMap((prev) => {
        const existing = prev[uid];
        if (existing?.current_activity === current_activity) return prev;
        return {
          ...prev,
          [uid]: {
            ...(existing ?? { userId: uid, status: "offline", custom_status: null }),
            userId: uid,
            current_activity,
          },
        };
      });
    };

    import("socket.io-client").then(({ io }) => {
      if (cancelled) return;

      const socket = io(`${API_BASE}/presence`, {
        withCredentials: true,
        transports: ["websocket"],
      });

      socketRef.current = socket;
      socket.on("presence:changed", onChanged);
      socket.on("presence:updated", onUpdated);
      socket.on("presence:activity", onActivity);

      heartbeatRef.current = setInterval(() => {
        socket.emit("presence:heartbeat");
      }, 30_000);
    });

    return () => {
      cancelled = true;
      clearInterval(heartbeatRef.current);
      const socket = socketRef.current;
      if (socket) {
        socket.off("presence:changed", onChanged);
        socket.off("presence:updated", onUpdated);
        socket.off("presence:activity", onActivity);
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [userId, updatePresence]);

  const subscribeTo = useCallback((friendId) => {
    if (!friendId) return;
    socketRef.current?.emit("presence:subscribe", { friendId });
  }, []);

  const unsubscribeFrom = useCallback((friendId) => {
    if (!friendId) return;
    socketRef.current?.emit("presence:unsubscribe", { friendId });
  }, []);

  const setCustomStatus = useCallback((custom_status, current_activity) => {
    socketRef.current?.emit("presence:update", { custom_status, current_activity });
  }, []);

  const value = useMemo(
    () => ({ presenceMap, subscribeTo, unsubscribeFrom, setCustomStatus }),
    [presenceMap, subscribeTo, unsubscribeFrom, setCustomStatus],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  return useContext(PresenceContext);
}
