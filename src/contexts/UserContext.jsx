"use client";
import { createContext, useEffect, useState } from "react";
import { ID } from "appwrite";
import { account } from "@/app/lib/appwrite";
import { updateAvatar } from "@/app/services/users";

export const UserContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadUser = async () => {
      try {
        const current = await account.get();
        setUser(current);
      } catch (error) {
        if (error?.code === 401 || error?.message?.includes('missing scopes (["account"])')) {
          // No active session — ignore
        } else {
          console.error("Appwrite error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  async function login(email, password) {
    try {
      await account.createEmailPasswordSession(email, password);
      const userData = await account.get();
      let preferences = null;
      try {
        preferences = await account.getPrefs();
      } catch {}
      setUser({ userData, preferences });
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error.message);
      return { success: false, message: error.message };
    }
  }

  async function register(email, password, name, avatarFile) {
    try {
      const userId = ID.unique();

      // 1️⃣ Create user account
      const newUser = await account.create(userId, email, password, name);

      // 2️⃣ Log in user first (so you have a session before prefs update)
      const loginResult = await login(email, password);
      if (!loginResult.success) throw new Error("Login failed right after registration");

      // 3️⃣ Upload avatar (if provided)
      let profileUrl = null;
      if (avatarFile) {
        profileUrl = await updateAvatar(newUser.$id, avatarFile);
      }
      // 4️⃣ Update preferences (safe now, because you're logged in)
      await account.updatePrefs({
        pomodoro_duration: 25,
        break_duration: 5,
        long_break_duration: 15,
        alarm_enabled: true,
        total_pomodoros: 0,
        total_minutes: 0,
        current_streak: 0,
        avatar: profileUrl,
      });

      return loginResult;
    } catch (error) {
      console.error("❌ Register error:", error.message);
      return { success: false, message: error.message };
    }
  }

  async function logout() {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </UserContext.Provider>
  );
}
