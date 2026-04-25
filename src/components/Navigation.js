import React, { useState } from "react";
import { FiSettings } from "react-icons/fi";
import { GiTomato } from "react-icons/gi";
import Link from "next/link";
import Image from "next/image";
import SignOut from "./SignOut";
import { ChartNoAxesCombined } from "lucide-react";
import { useUser } from "@/hooks/useUser";

function Navigation({ setOpenSettings, setShowStats }) {
  const { user } = useUser();
  const [openSignOut, setOpenSignOut] = useState(false);

  return (
    <nav className="pt-5 text-white flex justify-between w-11/12 mx-auto">
      <div className="flex items-center gap-1 cursor-pointer">
        <GiTomato className="text-lg" />
        <h1>Pomopal</h1>
      </div>
      <div className="flex w-32 justify-between items-center cursor-pointer">
        {user ? (
          user.avatar ? (
            <Image
              onClick={() => setOpenSignOut((v) => !v)}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              src={user.avatar}
              alt={user.name || "User"}
            />
          ) : (
            <div
              onClick={() => setOpenSignOut((v) => !v)}
              className="w-10 h-10 flex items-center justify-center bg-gray-600 rounded-full text-white"
            >
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
          )
        ) : (
          <Link href="/login" className="font-semibold">
            Login
          </Link>
        )}
        <FiSettings
          className="text-2xl cursor-pointer"
          onClick={() => setOpenSettings((v) => !v)}
        />
        <ChartNoAxesCombined
          className="text-2xl cursor-pointer"
          onClick={() => setShowStats((v) => !v)}
        />
      </div>
      {user && <SignOut openSettings={openSignOut} setOpenSettings={setOpenSignOut} />}
    </nav>
  );
}

export default React.memo(Navigation);
