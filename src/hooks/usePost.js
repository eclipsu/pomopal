"use client";

import { useState, useCallback } from "react";
import axiosClient from "@/utils/axios";
export function usePost(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(
    async (body = {}) => {
      try {
        setLoading(true);
        const res = await axiosClient.post(url, body);
        setData(res.data);
        setError(null);
        return res.data;
      } catch (err) {
        setError(err.response?.data || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  return { data, loading, error, submit };
}
