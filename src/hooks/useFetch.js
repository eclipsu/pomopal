"use client";

import { useState, useEffect, useCallback } from "react";
import axiosClient from "@/utils/axios";

export function useFetch(url, params = {}, options = {}) {
  const enabled = options.enabled ?? true;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(url) && enabled);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    try {
      setLoading(true);
      const res = await axiosClient.get(url, { params });
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [url, enabled, JSON.stringify(params)]);

  useEffect(() => {
    if (!url || !enabled) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
