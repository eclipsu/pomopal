"use client";
import { createContext, useEffect, useState } from "react";
import { ID } from "appwrite";
import { account, client } from "@/app/lib/appwrite";

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
          // No active session — fine
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
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error("Login error:", error.message);
      return { success: false, message: error.message };
    }
  }

  async function register(email, password) {
    try {
      await account.create(ID.unique(), email, password);
      return await login(email, password);
    } catch (error) {
      console.error("Register error:", error.message);
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
