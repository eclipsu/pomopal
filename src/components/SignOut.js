import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import supabase from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

function SettingsPopup({ setOpenSettings, openSettings }) {
  const [user, setUser] = useState({});
  const router = useRouter();

  useEffect(() => {
    async function getUserData() {
      await supabase.auth.getUser().then((value) => {
        if (value.data?.user) {
          setUser(value.data.user);
        }
      });
    }
    getUserData();
  }, []);

  const handleSignout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <div
      className={`absolute h-full w-full left-0 top-0 bg-black bg-opacity-30 ${
        openSettings ? "" : "hidden"
      } `}
    >
      <div>
        <div
          className={`p-5 rounded-md max-w-xl bg-white absolute sm:w-86 w-11/12 left-1/2 top-1/2 ${
            openSettings ? "" : "hidden"
          } `}
          style={{
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-gray-400 flex justify-between items-center">
            <FiX className="text-2xl cursor-pointer" onClick={() => setOpenSettings(false)} />
          </div>
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
