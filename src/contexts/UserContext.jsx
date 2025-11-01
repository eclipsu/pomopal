"use client";
import { createContext, useEffect, useState } from "react";
import { ID } from "appwrite";
import { account } from "@/app/lib/appwrite";

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

  // ✅ Load current session only on client
  useEffect(() => {
    if (typeof window === "undefined") return; // skip server side

    const loadUser = async () => {
      try {
        const current = await account.get();
        setUser(current);
      } catch (error) {
        // ❗ Appwrite throws “User (role: guests) missing scopes (["account"])”
        // when there’s no valid session — we ignore that safely.
        if (error?.code !== 401) console.error("Appwrite error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ✅ Login user
  async function login(email, password) {
    try {
      await account.createEmailPasswordSession(email, password);
      const response = await account.get();
      setUser(response);
      return { success: true, user: response };
    } catch (error) {
      console.error("Login error:", error.message);
      return { success: false, message: error.message };
    }
  }

  // ✅ Register new user
  async function register(email, password) {
    try {
      await account.create(ID.unique(), email, password);
      return await login(email, password);
    } catch (error) {
      console.error("Register error:", error.message);
      return { success: false, message: error.message };
    }
  }

  // ✅ Logout user
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
