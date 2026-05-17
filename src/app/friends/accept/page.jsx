"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axiosClient from "@/utils/axios";
import { useUser } from "@/hooks/useUser";

function AcceptFriendContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const attemptedRef = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid link.");
      return;
    }

    if (userLoading) return;

    if (!user) {
      const returnTo = `/friends/accept?token=${encodeURIComponent(token)}`;
      router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (attemptedRef.current) return;
    attemptedRef.current = true;

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
  }, [searchParams, router, user, userLoading]);

  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
        <div className="text-4xl mb-4">🍅</div>
        {(status === "loading" || userLoading) && (
          <p className="text-gray-400">Accepting invite...</p>
        )}
        {status === "success" && (
          <>
            <p className="text-green-400 font-medium">{message}</p>
            <p className="text-gray-500 text-sm mt-2">Redirecting you home...</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-red-400 font-medium">{message}</p>
            <Link
              href="/"
              className="inline-block mt-4 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Go home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function AcceptFriendPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-900 min-h-screen flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <AcceptFriendContent />
    </Suspense>
  );
}
