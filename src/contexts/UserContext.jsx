"use client";
import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import axiosClient from "@/utils/axios";

const USER_CACHE_KEY = "pomopal:user";
const SESSION_HINT_COOKIE = "pomopal_session";

function readCachedUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedUser(user) {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      window.localStorage.removeItem(USER_CACHE_KEY);
      return;
    }
    window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {
    // ignore quota / private mode
  }
}

function readSessionHint() {
  if (typeof document === "undefined") return false;
  try {
    return document.cookie
      .split(";")
      .some((part) => part.trim().startsWith(`${SESSION_HINT_COOKIE}=1`));
  } catch {
    return false;
  }
}

function normalizeUser(data) {
  if (!data) return null;
  return { ...data, avatar: data.avatar_url ?? data.avatar ?? null };
}

export const UserContext = createContext({
  user: null,
  loading: true,
  revalidating: false,
  sessionLikely: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refetch: async () => null,
});

export function UserProvider({ children }) {
  // Start empty on server + first client render (hydration-safe).
  // useLayoutEffect restores cache before the browser paints.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [sessionLikely, setSessionLikely] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser);
    writeCachedUser(nextUser);
    setSessionLikely(Boolean(nextUser));
  }, []);

  const fetchSession = useCallback(async () => {
    const cached = readCachedUser();
    const hinted = Boolean(cached) || readSessionHint();

    if (hinted) {
      setRevalidating(true);
      setSessionLikely(true);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      // One request: validates access, or refreshes, then returns profile.
      const res = await axiosClient.get("/auth/session");
      const nextUser = normalizeUser(res.data);
      applyUser(nextUser);
      return nextUser;
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        applyUser(null);
      }
      return null;
    } finally {
      setLoading(false);
      setRevalidating(false);
    }
  }, [applyUser]);

  useLayoutEffect(() => {
    const cached = readCachedUser();
    const hinted = Boolean(cached) || readSessionHint();
    if (cached) {
      setUser(cached);
      setSessionLikely(true);
      setLoading(false);
      setRevalidating(true);
    } else if (hinted) {
      setSessionLikely(true);
      setLoading(true);
    }
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    if (!bootstrapped) return;
    fetchSession();
  }, [bootstrapped, fetchSession]);

  const login = useCallback(
    async (email, password) => {
      try {
        await axiosClient.post("/auth/login", { email, password });
        const res = await axiosClient.get("/auth/session");
        const nextUser = normalizeUser(res.data);
        applyUser(nextUser);
        setLoading(false);
        setRevalidating(false);
        return { success: true, user: nextUser };
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },
    [applyUser],
  );

  const register = useCallback(
    async (email, password, name, timezone, username) => {
      try {
        await axiosClient.post("/user", {
          email,
          password,
          name,
          timezone,
          username,
        });
        return await login(email, password);
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || error.message,
        };
      }
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await axiosClient.post("/auth/logout");
    } catch {}
    applyUser(null);
    setLoading(false);
    setRevalidating(false);
  }, [applyUser]);

  const value = useMemo(
    () => ({
      user,
      loading,
      revalidating,
      sessionLikely: sessionLikely || Boolean(user),
      login,
      register,
      logout,
      refetch: fetchSession,
    }),
    [
      user,
      loading,
      revalidating,
      sessionLikely,
      login,
      register,
      logout,
      fetchSession,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
