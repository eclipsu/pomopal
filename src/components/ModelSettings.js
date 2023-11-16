import React from "react";
import { FiX } from "react-icons/fi";
import supabase from "@/app/lib/supabase";
import { useEffect, useState } from "react";

function components({
  pomodoro,
  shortBreaks,
  longBreaks,
  pomodoroRef,
  shortBreakRef,
  longBreakRef,
  setOpenSettings,
  openSettings,
  updateTimeDefaultValue,
  username,
}) {
  const inputs = [
    {
      value: "Pomodoro",
      ref: pomodoroRef,
      defaultValue: pomodoro,
    },
    {
      value: "Short Break",
      ref: shortBreakRef,
      defaultValue: shortBreaks,
    },
    {
      value: "Long Break",
      ref: longBreakRef,
      defaultValue: longBreaks,
    },
  ];

  const [user, setUser] = useState({});

  useEffect(() => {
    async function getUserData() {
      await supabase.auth.getUser().then((value) => {
        if (value.data?.user) {
          console.log("sex", value.data.user);
          setUser(value.data.user);
        }
      });
    }
    getUserData();
  }, []);

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
            <h1 className="uppercase font-bold tracking-wider">
              {user.user_metadata?.full_name || "User"}'s SETTINGS
            </h1>
            <FiX className="text-2xl cursor-pointer" onClick={() => setOpenSettings(false)} />
          </div>
          <div className="h-1 w-full bg-gray-400 my-5"></div>
          <div className="flex gap-5">
            {inputs.map((input, index) => {
              return (
                <div key={index}>
                  <h1 className="text-gray-400 text-sm">{input.value}</h1>
                  <input
                    defaultValue={input.defaultValue}
                    type="number"
                    className="w-full bg-gray-400 bg-opacity-30 py-2 rounded outline-none text-center"
                    ref={input.ref}
                  />
                </div>
              );
            })}
          </div>
          <button
            className="bg-green-600 uppercase w-full mt-5 text-white rounded py-2"
            onClick={updateTimeDefaultValue}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
export default React.memo(components);
