"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useUser } from "@/hooks/useUser";

const PresenceContext = createContext(null);

export function PresenceProvider({ children }) {
  const { user } = useUser();
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const [presenceMap, setPresenceMap] = useState({}); // { [userId]: PresenceData }

  const updatePresence = useCallback((data) => {
    setPresenceMap((prev) => ({ ...prev, [data.userId]: data }));
  }, []);

  useEffect(() => {
    if (!user) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_BASE_URL}/presence`, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("presence:changed", (data) => {
      updatePresence(data);
    });
    socket.on("presence:updated", updatePresence);
    socket.on("presence:snapshot", (snapshot) => {
      setPresenceMap((prev) => {
        const next = { ...prev };
        Object.entries(snapshot).forEach(([uid, status]) => {
          next[uid] = { ...next[uid], userId: uid, status };
        });
        return next;
      });
    });

    // Heartbeat every 30s
    heartbeatRef.current = setInterval(() => {
      socket.emit("presence:heartbeat");
    }, 30_000);

    return () => {
      clearInterval(heartbeatRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const subscribeTo = useCallback((friendId) => {
    socketRef.current?.emit("presence:subscribe", { friendId });
  }, []);

  const unsubscribeFrom = useCallback((friendId) => {
    socketRef.current?.emit("presence:unsubscribe", { friendId });
  }, []);

  const setCustomStatus = useCallback((custom_status, current_activity) => {
    socketRef.current?.emit("presence:update", { custom_status, current_activity });
  }, []);

  return (
    <PresenceContext.Provider
      value={{ presenceMap, subscribeTo, unsubscribeFrom, setCustomStatus }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
