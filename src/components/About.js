import React from "react";
import Link from "next/link";
import { FaDiscord } from "react-icons/fa";

function components() {
  return (
    <div className="w-11/12 mx-auto mt-36 text-white p-5">
      <div className="">
        <h1 className="text-xl sm:text-2xl font-medium">
          <span className="border-b-4 border-red-400">What</span> is Pomopal?
        </h1>
        <p className="mt-5 tracking-wide opacity-70 text-lg">
          PomoPal is a pomodoro timer app that helps students focus on their work by breaking it
          into intervals and reminding them to take breaks.
        </p>
      </div>
      <div className="mt-5">
        <h1 className="text-xl sm:text-2xl font-medium">
          <span className="border-b-4 border-red-400">Note</span>
        </h1>
        <p className="mt-5 tracking-wide opacity-70 text-lg">
          PomoPal is still under construction and some features may not be fully functional yet. We
          appreciate your patience as we continue to work on improving the app. If you encounter any
          issues or have suggestions for improvement, please feel free to submit them through our
          issue tracker.
        </p>
        <p className="mt-5 tracking-wide opacity-70 text-lg flex items-center">
          <FaDiscord className="text-xl mr-4" />
          To be updated, join our&nbsp;
          <Link className="underline" href="https://discord.gg/czx5d2vx" target="_blank">
            Discord
          </Link>
        </p>
      </div>
    </div>
  );
}
export default React.memo(components);
