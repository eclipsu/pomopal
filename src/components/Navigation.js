import React from "react";
import { FiSettings } from "react-icons/fi";
import { GiTomato } from "react-icons/gi";
import Link from "next/link";
import supabase from "@/app/lib/supabase";
import { useState, useEffect } from "react";
import Image from "next/image";
import SignOut from "./SignOut";

function Navigation({ setOpenSettings }) {
  const [user, setUser] = useState({});
  const [openSignOut, setOpenSignOut] = useState(false);

  useEffect(() => {
    async function getUserData() {
      await supabase.auth.getUser().then((value) => {
        if (value.data?.user) {
          console.log(value.data.user);
          setUser(value.data.user);
        }
      });
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
        {Object.keys(user).length !== 0 ? (
          <>
            {user.identities && user.identities.length > 0 && (
              <Image
                onClick={() => setOpenSignOut((value) => !value)}
                width={500}
                height={500}
                className="w-10 h-10 rounded"
                src={user.identities[0].identity_data.avatar_url}
                alt={user.identities[0].identity_data.full_name}
              />
            )}
          </>
        ) : (
          <Link href={"/login"} className="font-semibold">
            Login
          </Link>
        )}

        <FiSettings
          className="text-2xl cursor-pointer"
          onClick={() => setOpenSettings((value) => !value)}
        />
      </div>
      <SignOut openSettings={openSignOut} setOpenSettings={setOpenSignOut} />
    </nav>
  );
}

export default React.memo(Navigation);
