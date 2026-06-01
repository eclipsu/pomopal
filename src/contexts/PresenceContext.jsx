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
import { getSocketBaseUrl, getSocketPath, getSocketClientOptions } from "@/utils/apiBase";
import axiosClient from "@/utils/axios";

const PresenceContext = createContext(null);

function presenceEquals(a, b) {
  if (!a || !b) return false;
  return (
    a.status === b.status &&
    a.custom_status === b.custom_status &&
    a.last_seen_at === b.last_seen_at
  );
}

export function PresenceProvider({ children }) {
  const { user } = useUser();
  const userId = user?.id;
  const socketRef = useRef(null);
  const subscriptionsRef = useRef(new Set());
  const [presenceMap, setPresenceMap] = useState({});

  const updatePresence = useCallback((data) => {
    if (!data?.userId) return;
    setPresenceMap((prev) => {
      const existing = prev[data.userId];
      if (presenceEquals(existing, data)) return prev;
      return { ...prev, [data.userId]: data };
    });
  }, []);

  const touchActive = useCallback(() => {
    socketRef.current?.emit("presence:active");
  }, []);

  const flushSubscriptions = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    subscriptionsRef.current.forEach((friendId) => {
      socket.emit("presence:subscribe", { friendId });
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      setPresenceMap({});
      subscriptionsRef.current.clear();
      return;
    }

    let cancelled = false;

    const onChanged = (data) => updatePresence(data);
    const onUpdated = (data) => updatePresence(data);

    const onVisible = () => {
      if (document.visibilityState === "visible") touchActive();
    };

    (async () => {
      let token;
      try {
        const { data } = await axiosClient.get("/auth/socket-token");
        token = data?.token;
      } catch (err) {
        console.error(
          "[presence] socket-token failed:",
          err?.response?.status ?? err?.message,
        );
        return;
      }
      if (cancelled || !token) return;

      const { io } = await import("socket.io-client");
      if (cancelled) return;

      const socket = io(`${getSocketBaseUrl()}/presence`, {
        path: getSocketPath(),
        auth: { token },
        withCredentials: true,
        ...getSocketClientOptions(),
      });

      socketRef.current = socket;
      socket.on("connect", () => {
        touchActive();
        flushSubscriptions();
      });
      socket.on("presence:changed", onChanged);
      socket.on("presence:updated", onUpdated);

      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", touchActive);
      window.addEventListener("pagehide", touchActive);
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", touchActive);
      window.removeEventListener("pagehide", touchActive);
      const socket = socketRef.current;
      if (socket) {
        socket.off("presence:changed", onChanged);
        socket.off("presence:updated", onUpdated);
        socket.removeAllListeners("connect");
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [userId, updatePresence, flushSubscriptions, touchActive]);

  const subscribeTo = useCallback((friendId) => {
    if (!friendId) return;
    subscriptionsRef.current.add(friendId);
    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit("presence:subscribe", { friendId });
    }
  }, []);

  const unsubscribeFrom = useCallback((friendId) => {
    if (!friendId) return;
    subscriptionsRef.current.delete(friendId);
    socketRef.current?.emit("presence:unsubscribe", { friendId });
  }, []);

  const setCustomStatus = useCallback((custom_status) => {
    socketRef.current?.emit("presence:update", { custom_status });
  }, []);

  const value = useMemo(
    () => ({ presenceMap, subscribeTo, unsubscribeFrom, setCustomStatus, touchActive }),
    [presenceMap, subscribeTo, unsubscribeFrom, setCustomStatus, touchActive],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence() {
  return useContext(PresenceContext);
}
