"use client";

import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import Image from "next/image";
import Button from "./Button";
import axiosClient from "../utils/axios";

function SignOut({ setOpenSettings, openSettings }) {
  const { user, logout } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignout = async () => {
    try {
      setIsLoading(true);
      axiosClient.post(`/auth/logout`);
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!openSettings) return null;

  return (
    <div className="absolute h-full w-full left-0 top-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="p-5 rounded-md max-w-xl bg-white sm:w-86 w-11/12">
        <div className="text-gray-400 flex justify-between items-center">
          {user?.avatar && (
            <Image
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              src={user.avatar}
              alt={user.name || "User"}
            />
          )}
          <h1 className="uppercase font-bold tracking-wider">{user?.name || "User"}'s SETTINGS</h1>
          <FiX className="text-2xl cursor-pointer" onClick={() => setOpenSettings(false)} />
        </div>

        <div className="h-1 w-full bg-gray-400 my-5"></div>

        <Button
          type="button"
          disabled={isLoading}
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
          onClick={handleSignout}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing out...
            </div>
          ) : (
            <div className="flex items-center gap-2">Sign Out</div>
          )}
        </Button>
      </div>
    </div>
  );
}

export default React.memo(SignOut);
