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
    a.current_activity === b.current_activity
  );
}

export function PresenceProvider({ children }) {
  const { user } = useUser();
  const userId = user?.id;
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
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

  const flushSubscriptions = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    subscriptionsRef.current.forEach((friendId) => {
      socket.emit("presence:subscribe", { friendId });
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      console.log("[presence] waiting for login");
      setPresenceMap({});
      subscriptionsRef.current.clear();
      return;
    }

    console.log("[presence] starting connection for user", userId);
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
      if (cancelled || !token) {
        console.warn("[presence] no token, aborting");
        return;
      }

      const { io } = await import("socket.io-client");
      if (cancelled) return;

      const url = `${getSocketBaseUrl()}/presence`;
      const path = getSocketPath();
      console.log("[presence] connecting", { url, path, ...getSocketClientOptions() });

      const socket = io(url, {
        path,
        auth: { token },
        withCredentials: true,
        ...getSocketClientOptions(),
      });

      socketRef.current = socket;
      socket.on("connect", () => {
        console.log("[presence] socket connected");
        flushSubscriptions();
      });
      socket.on("disconnect", (reason) => {
        console.log("[presence] socket disconnected:", reason);
      });
      socket.on("connect_error", (err) => {
        console.error("[presence] socket connect_error:", err.message);
      });
      socket.on("presence:changed", onChanged);
      socket.on("presence:updated", onUpdated);
      socket.on("presence:activity", onActivity);

      heartbeatRef.current = setInterval(() => {
        if (socket.connected) socket.emit("presence:heartbeat");
      }, 30_000);
    })();

    return () => {
      cancelled = true;
      clearInterval(heartbeatRef.current);
      const socket = socketRef.current;
      if (socket) {
        socket.off("presence:changed", onChanged);
        socket.off("presence:updated", onUpdated);
        socket.off("presence:activity", onActivity);
        socket.removeAllListeners("connect");
        socket.removeAllListeners("disconnect");
        socket.removeAllListeners("connect_error");
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [userId, updatePresence, flushSubscriptions]);

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
