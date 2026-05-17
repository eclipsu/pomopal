"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import axiosClient from "@/utils/axios";

export default function SuccessPage() {
  const { refetch } = useUser();
  const router = useRouter();

  useEffect(() => {
    const sync = async () => {
      const time_zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      try {
        await axiosClient.patch("/user/timezone", { time_zone });
      } catch {
        // profile may not be ready yet; refetch still runs
      }
      await refetch();
      router.push("/");
    };
    sync().catch(() => router.push("/login"));
  }, [refetch, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white text-xl">Signing you in...</div>
    </div>
  );
}
