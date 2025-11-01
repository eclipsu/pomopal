"use client";
import { createContext, useEffect, useState } from "react";
import { ID } from "appwrite";
import { account } from "@/app/lib/appwrite";

export const UserContext = createContext({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const loadUser = async () => {
      try {
        const current = await account.get();
        setUser(current);
      } catch (error) {
        console.log(error);
      }
    };
    loadUser();
  }, []);

  async function login(email, password) {
    try {
      await account.createEmailPasswordSession(email, password);
      const response = await account.get();
      setUser(response);
      console.log(response);
      return { success: true, user: response };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async function register(email, password) {
    try {
      await account.create(ID.unique(), email, password);
      console.log("reg");
      await login(email, password);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
  async function logout() {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <UserContext.Provider value={{ user, login, register, logout }}>
      {children}
    </UserContext.Provider>
  );
}
