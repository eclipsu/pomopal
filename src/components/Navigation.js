import React, { useState } from "react";
import { FiSettings } from "react-icons/fi";
import { GiTomato } from "react-icons/gi";
import Link from "next/link";
import Image from "next/image";
import SignOut from "./SignOut";
import { ChartNoAxesCombined, Users } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import StreakIndicator from "@/components/StreakIndicator";
import NotificationBell from "@/components/NotificationBell";

function Navigation({ setOpenSettings, setShowStats, showFriends, setShowFriends }) {
  const { user } = useUser();
  const [openSignOut, setOpenSignOut] = useState(false);

  return (
    <nav className="pt-5 text-white flex justify-between w-11/12 mx-auto">
      <div className="flex items-center gap-1 cursor-pointer">
        <GiTomato className="text-lg" />
        <h1>Pomopal</h1>
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Admin
              </Link>
            )}
            <StreakIndicator />
            <NotificationBell />
            {user.avatar ? (
              <Image
                onClick={() => setOpenSignOut((v) => !v)}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover cursor-pointer"
                src={user.avatar}
                alt={user.name || "User"}
              />
            ) : (
              <div
                onClick={() => setOpenSignOut((v) => !v)}
                className="w-10 h-10 flex items-center justify-center bg-gray-600 rounded-full text-white cursor-pointer"
              >
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
            <FiSettings
              className="text-2xl cursor-pointer"
              onClick={() => setOpenSettings((v) => !v)}
            />
            <ChartNoAxesCombined
              className="text-2xl cursor-pointer"
              onClick={() => setShowStats((v) => !v)}
            />
            <Users
              className={`text-2xl cursor-pointer transition-colors ${
                showFriends ? "text-red-400" : "text-white hover:text-gray-300"
              }`}
              onClick={() => setShowFriends((v) => !v)}
            />
          </>
        ) : (
          <Link href="/login" className="font-semibold">
            Login
          </Link>
        )}
      </div>
      {user && <SignOut openSettings={openSignOut} setOpenSettings={setOpenSignOut} />}
    </nav>
  );
}

export default React.memo(Navigation);
