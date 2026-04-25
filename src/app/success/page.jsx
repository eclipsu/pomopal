"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";

export default function SuccessPage() {
  const { refetch } = useUser();
  const router = useRouter();

  useEffect(() => {
    refetch()
      .then(() => router.push("/"))
      .catch(() => router.push("/login"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white text-xl">Signing you in...</div>
    </div>
  );
}
