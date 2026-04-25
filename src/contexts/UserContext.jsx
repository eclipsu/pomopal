"use client";
import { createContext, useEffect, useState } from "react";
import axiosClient from "@/utils/axios";

export const UserContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refetch: async () => {},
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get("/user/profile");
      setUser({ ...res.data, avatar: res.data.avatar_url });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  async function login(email, password) {
    try {
      await axiosClient.post("/auth/login", { email, password });
      const profile = await axiosClient.get("/user/profile");
      const user = { ...profile.data, avatar: profile.data.avatar_url };
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }

  async function register(email, password, name, timezone) {
    try {
      await axiosClient.post("/user", { email, password, name, timezone });
      return await login(email, password);
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }

  async function logout() {
    try {
      await axiosClient.post("/auth/logout");
    } catch {}
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, loading, login, register, logout, refetch: fetchProfile }}>
      {children}
    </UserContext.Provider>
  );
}
