"use client";

import { createContext, useContext, useState, useCallback } from "react";
import axiosClient from "@/utils/axios";

const FriendsContext = createContext(null);

export function FriendsProvider({ children }) {
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get("/friends");
      setFriends(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load friends");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const [received, sent] = await Promise.all([
        axiosClient.get("/friends/requests/received"),
        axiosClient.get("/friends/requests/sent"),
      ]);
      setPendingReceived(received.data);
      setPendingSent(sent.data);
    } catch {
      // non-fatal
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchFriends(), fetchPending()]);
  }, [fetchFriends, fetchPending]);

  const sendInvite = useCallback(
    async (email) => {
      await axiosClient.post("/friends/invite", { email });
      await fetchPending();
    },
    [fetchPending],
  );

  const unfriend = useCallback(async (friendId) => {
    try {
      await axiosClient.delete(`/friends/${friendId}`);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch (e) {
      throw e;
    }
  }, []);

  const acceptPending = useCallback(
    async (friendshipId) => {
      await axiosClient.post(`/friends/requests/${friendshipId}/accept`);
      setPendingReceived((prev) => prev.filter((r) => r.id !== friendshipId));
      await fetchFriends();
    },
    [fetchFriends],
  );

  const cancelPending = useCallback(async (friendshipId) => {
    await axiosClient.delete(`/friends/requests/${friendshipId}`);
    setPendingReceived((prev) => prev.filter((r) => r.id !== friendshipId));
    setPendingSent((prev) => prev.filter((r) => r.id !== friendshipId));
  }, []);

  return (
    <FriendsContext.Provider
      value={{
        friends,
        pendingReceived,
        pendingSent,
        loading,
        error,
        fetchFriends,
        fetchPending,
        refreshAll,
        sendInvite,
        unfriend,
        acceptPending,
        cancelPending,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) {
    throw new Error("useFriends must be used within FriendsProvider");
  }
  return ctx;
}
