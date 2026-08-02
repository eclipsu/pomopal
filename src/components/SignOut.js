"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import Button from "./Button";
import axiosClient from "../utils/axios";

function SignOut({ setOpenSettings, openSettings }) {
  const { user, logout } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!openSettings) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenSettings(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSettings, setOpenSettings]);

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

  if (!openSettings || !mounted) return null;

  const profileHref = user?.username ? `/${user.username}` : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
      onClick={() => setOpenSettings(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="w-11/12 max-w-xl rounded-md bg-white p-5 sm:w-86"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-gray-400">
          {user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={user.avatar}
              alt={user.name || "User"}
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </span>
          )}
          <h1 className="font-bold uppercase tracking-wider text-gray-800">
            {user?.name || "User"}
          </h1>
          <FiX
            className="cursor-pointer text-2xl"
            onClick={() => setOpenSettings(false)}
          />
        </div>

        <div className="my-5 h-1 w-full bg-gray-400" />

        {profileHref ? (
          <Link
            href={profileHref}
            onClick={() => setOpenSettings(false)}
            className="mb-3 flex h-12 w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
          >
            View profile
            {user?.username ? (
              <span className="ml-1 font-normal text-gray-500">
                @{user.username}
              </span>
            ) : null}
          </Link>
        ) : null}

        <Button
          type="button"
          disabled={isLoading}
          className="h-12 w-full rounded-xl bg-blue-500 font-semibold text-white transition-all duration-200 hover:bg-blue-600"
          onClick={handleSignout}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing out...
            </div>
          ) : (
            <div className="flex items-center gap-2">Sign Out</div>
          )}
        </Button>
      </div>
    </div>,
    document.body,
  );
}

export default React.memo(SignOut);
