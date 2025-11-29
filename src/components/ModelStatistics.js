import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { account } from "@/app/lib/appwrite";
import Image from "next/image";

import Box from "@mui/material/Box";
import { BarChart } from "@mui/x-charts/BarChart";
import { Clock, Calendar, Flame } from "lucide-react";
import { getStreak } from "@/app/services/analytics";

const StatCard = ({ icon: Icon, value, label }) => (
  <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center aspect-square w-28 border border-gray-200">
    <Icon className="text-gray-400 mb-1" size={24} strokeWidth={1.5} />
    <div className="text-gray-800 text-3xl font-bold mb-0.5">{value}</div>
    <div className="text-gray-500 text-xs">{label}</div>
  </div>
);

function ModelSettings({ setOpenSettings, openSettings }) {
  const [user, setUser] = useState({});
  const [streak, setStreak] = useState(0);
  const workData = [4, 0, 15, 9, 6, 3, 2];
  const xLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    async function getUserData() {
      try {
        const userData = await account.get();
        setUser(userData);
        const s = await getStreak(userData.$id);
        setStreak(s ?? 0);
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
            <h1 className="uppercase font-bold tracking-wider text-gray-800">
              {user.name || "User"}'s Statistics
            </h1>
            <FiX
              className="text-2xl cursor-pointer text-gray-600"
              onClick={() => setOpenSettings(false)}
            />
          </div>

          <div className="h-1 w-full bg-gray-200 my-5"></div>

          <div className="my-6">
            <h2 className="text-gray-600 text-lg font-semibold mb-2">Summary at Glance</h2>
            <div className="h-px w-full bg-gray-300"></div>
          </div>

          <div className="flex gap-4">
            {/* <StatCard icon={Clock} value="361" label="hours focused" /> */}
            {/* <StatCard icon={Calendar} value="118" label="days accessed" /> */}
            <StatCard icon={Flame} value={streak} label="day streak" />
          </div>
          <div className="my-6">
            <h2 className="text-gray-600 text-lg font-semibold mb-2">Your Hours</h2>
            <div className="h-px w-full bg-gray-300"></div>
          </div>
          <div className="flex flex-col items-center">
            <Box sx={{ width: "100%", height: 300 }}>
              <BarChart
                series={[{ data: workData, label: "Work", id: "workId", stack: "total" }]}
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
