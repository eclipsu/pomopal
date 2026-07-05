import React, { useState } from "react";
import { FiSettings } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import SignOut from "./SignOut";
import PomopalIcon from "./PomopalIcon";
import { ChartNoAxesCombined, Users } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import StreakIndicator from "@/components/StreakIndicator";

function Navigation({ setOpenSettings, setShowStats, showFriends, setShowFriends }) {
  const { user } = useUser();
  const [openSignOut, setOpenSignOut] = useState(false);

  return (
    <nav className="pt-5 text-white flex items-center justify-between w-11/12 max-w-full mx-auto gap-2 sm:gap-4 min-w-0">
      <Link href="/" className="flex items-center gap-1.5 shrink-0 hover:opacity-90 transition-opacity">
        <PomopalIcon size={28} className="shrink-0" />
        <h1 className="font-semibold tracking-tight">Pomopal</h1>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {user ? (
          <>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 shrink-0"
              >
                Admin
              </Link>
            )}
            <StreakIndicator />
            <FiSettings
              className="text-2xl cursor-pointer shrink-0 hover:text-gray-300 transition-colors"
              onClick={() => setOpenSettings((v) => !v)}
              aria-label="Settings"
            />
            <ChartNoAxesCombined
              className="text-2xl cursor-pointer shrink-0 hover:text-gray-300 transition-colors"
              onClick={() => setShowStats((v) => !v)}
              aria-label="Statistics"
            />
            <Users
              className={`text-2xl cursor-pointer shrink-0 transition-colors ${
                showFriends ? "text-red-400" : "text-white hover:text-gray-300"
              }`}
              onClick={() => setShowFriends((v) => !v)}
              aria-label="Friends"
            />
            {user.avatar ? (
              <button
                type="button"
                onClick={() => setOpenSignOut((v) => !v)}
                className="shrink-0 ml-1 rounded-full ring-2 ring-transparent hover:ring-white/20 transition-all"
                aria-label="Account menu"
              >
                <Image
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                  src={user.avatar}
                  alt={user.name || "User"}
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpenSignOut((v) => !v)}
                className="w-10 h-10 shrink-0 ml-1 flex items-center justify-center bg-gray-600 rounded-full text-white hover:bg-gray-500 transition-colors"
                aria-label="Account menu"
              >
                {user.name ? user.name[0].toUpperCase() : "U"}
              </button>
            )}
          </>
        ) : (
          <Link href="/login" className="font-semibold shrink-0 hover:text-red-300 transition-colors">
            Login
          </Link>
        )}
      </div>

      {user && <SignOut openSettings={openSignOut} setOpenSettings={setOpenSignOut} />}
    </nav>
  );
}

export default React.memo(Navigation);
