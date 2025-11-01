import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { account } from "@/app/lib/appwrite";
import { useRouter } from "next/navigation";

function SettingsPopup({ setOpenSettings, openSettings }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

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

  const handleSignout = async () => {
    try {
      await account.deleteSession("current");
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <div
      className={`absolute h-full w-full left-0 top-0 bg-black bg-opacity-30 ${
        openSettings ? "" : "hidden"
      }`}
    >
      <div>
        <div
          className={`p-5 rounded-md max-w-xl bg-white absolute sm:w-86 w-11/12 left-1/2 top-1/2 ${
            openSettings ? "" : "hidden"
          }`}
          style={{
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-gray-400 flex justify-between items-center">
            <h1 className="uppercase font-bold tracking-wider">
              {user?.name || "User"}’s SETTINGS
            </h1>
            <FiX className="text-2xl cursor-pointer" onClick={() => setOpenSettings(false)} />
          </div>

          <div className="h-1 w-full bg-gray-400 my-5"></div>

          <button
            className="bg-red-600 uppercase w-full mt-3 text-white rounded py-2"
            onClick={handleSignout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(SettingsPopup);
