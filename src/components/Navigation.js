import React, { useEffect, useState } from "react";
import { FiSettings } from "react-icons/fi";
import { GiTomato } from "react-icons/gi";
import Link from "next/link";
import { account } from "@/app/lib/appwrite";
import Image from "next/image";
import SignOut from "./SignOut";
import { ChartNoAxesCombined } from "lucide-react";

function Navigation({ setOpenSettings, setShowStats }) {
  const [user, setUser] = useState(null);
  const [openSignOut, setOpenSignOut] = useState(false);

  useEffect(() => {
    async function getUserData() {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch (error) {
        console.log("No active session:", error.message);
      }
    }
    getUserData();
  }, []);

  return (
    <nav className="pt-5 text-white flex justify-between w-11/12 mx-auto">
      <div className="flex items-center gap-1 cursor-pointer">
        <GiTomato className="text-lg" />
        <h1 className="">Pomopal</h1>
      </div>
      <div className="flex w-32 justify-between items-center cursor-pointer">
        {user ? (
          <>
            {user.prefs?.avatar ? (
              <Image
                onClick={() => setOpenSignOut((value) => !value)}
                width={500}
                height={500}
                className="w-10 h-10 rounded-full object-cover"
                src={user.prefs.avatar}
                alt={user.name || "User"}
              />
            ) : (
              <div
                onClick={() => setOpenSignOut((value) => !value)}
                className="w-10 h-10 flex items-center justify-center bg-gray-600 rounded-full text-white"
              >
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
          </>
        ) : (
          <Link href="/login" className="font-semibold">
            Login
          </Link>
        )}
        <FiSettings
          className="text-2xl cursor-pointer"
          onClick={() => setOpenSettings((value) => !value)}
        />
        <ChartNoAxesCombined
          className="text-2xl cursor-pointer"
          onClick={() => setShowStats((value) => !value)}
        />
      </div>
      {user && <SignOut openSettings={openSignOut} setOpenSettings={setOpenSignOut} />}
    </nav>
  );
}

export default React.memo(Navigation);
