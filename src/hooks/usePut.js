import { useState, useCallback } from "react";
import axiosClient from "@/utils/axios";

export function usePut(url) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(
    async (data) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.put(url, data);
        return res.data;
      } catch (err) {
        setError(err.response?.data || err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  return { submit, loading, error };
}
