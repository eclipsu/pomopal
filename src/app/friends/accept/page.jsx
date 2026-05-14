"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosClient from "@/utils/axios";

export default function AcceptFriendPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid link.");
      return;
    }

    axiosClient
      .post("/friends/accept", { token })
      .then(() => {
        setStatus("success");
        setMessage("Friend request accepted!");
        setTimeout(() => router.push("/"), 2000);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.response?.data?.message || "Failed to accept invite.");
      });
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
        <div className="text-4xl mb-4">🍅</div>
        {status === "loading" && <p className="text-gray-400">Accepting invite...</p>}
        {status === "success" && (
          <>
            <p className="text-green-400 font-medium">{message}</p>
            <p className="text-gray-500 text-sm mt-2">Redirecting you home...</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-red-400 font-medium">{message}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Go home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
