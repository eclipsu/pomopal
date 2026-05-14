import { useState, useCallback } from "react";
import axiosClient from "@/utils/axios";

export function useFriends() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosClient.get("/friends");
      setFriends(data);
      console.log(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load friends");
    } finally {
      setLoading(false);
    }
  }, []);

  const sendInvite = useCallback(async (email) => {
    await axiosClient.post("/friends/invite", { email });
  }, []);

  const unfriend = useCallback(async (friendId) => {
    await axiosClient.delete(`/friends/${friendId}`);
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  }, []);

  return { friends, loading, error, fetchFriends, sendInvite, unfriend };
}
