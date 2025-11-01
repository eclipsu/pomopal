import React from "react";

const Input = ({ className, error, ...props }) => (
  <input
    className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
      error
        ? "border-red-500 focus-visible:ring-red-500/20"
        : "border-white/20 focus-visible:ring-blue-500/20"
    } ${className}`}
    {...props}
  />
);
export default Input;
