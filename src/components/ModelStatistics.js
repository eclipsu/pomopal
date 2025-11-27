import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { account } from "@/app/lib/appwrite";
import Image from "next/image";

import Box from "@mui/material/Box";
import { BarChart } from "@mui/x-charts/BarChart";

function ModelSettings({ setOpenSettings, openSettings }) {
  const [user, setUser] = useState({});
  const workData = [4, 0, 15, 9, 6, 3, 2];
  const breakData = [3, 8, 2, 5, 10, 4, 6];
  const xLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    async function getUserData() {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    }
    getUserData();
  }, []);

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
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <div className="text-gray-400 flex justify-between items-center">
            {user.prefs?.avatar ? (
              <Image
                width={500}
                height={500}
                className="w-10 h-10 rounded-full object-cover"
                src={user.prefs.avatar}
                alt={user.name || "User"}
              />
            ) : null}
            <h1 className="uppercase font-bold tracking-wider">{user.name || "User"}'s SETTINGS</h1>
            <FiX className="text-2xl cursor-pointer" onClick={() => setOpenSettings(false)} />
          </div>

          <div className="h-1 w-full bg-gray-400 my-5"></div>

          <div className="flex  flex-col items-center ">
            <Box sx={{ width: "100%", height: 300 }}>
              <BarChart
                series={[
                  { data: workData, label: "Work", id: "workId", stack: "total" },
                  { data: breakData, label: "Break", id: "breakId", stack: "total" },
                ]}
                xAxis={[{ data: xLabels }]}
                yAxis={[{ width: 50 }]}
              />
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ModelSettings);
