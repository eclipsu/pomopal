import React from "react";
import { FiSettings } from "react-icons/fi";
import { GiTomato } from "react-icons/gi";

function Navigation({ setOpenSettings }) {
  return (
    <nav className="pt-5 text-white  flex justify-between w-11/12 mx-auto">
      <div className="flex items-center gap-1 cursor-pointer">
        <GiTomato className="text-lg" />
        <h1 className="">Pomopal</h1>
      </div>
      <FiSettings
        className="text-2xl cursor-pointer "
        onClick={() => setOpenSettings((value) => !value)}
      />
    </nav>
  );
}

export default React.memo(Navigation);
