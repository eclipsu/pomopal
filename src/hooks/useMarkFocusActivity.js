"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { markFocusToday } from "@/lib/focusDateStorage";

/**
 * After session complete — refresh streak + analytics from server.
 * Do NOT call this on every heartbeat (causes refetch storms + races).
 */
export function useMarkFocusActivity() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    markFocusToday();
    queryClient.invalidateQueries({ queryKey: ["streak"] });
    queryClient.invalidateQueries({ queryKey: ["analytics", "calendar"] });
    queryClient.invalidateQueries({ queryKey: ["analytics", "all-time"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);
}

/** Heartbeat only — local date for fire icon, no query invalidation. */
export function useMarkFocusTodayLocal() {
  return useCallback(() => {
    markFocusToday();
  }, []);
}
