"use client";

import { useState } from "react";
import ProfilePictureUploader from "./ProfilePictureUploader";
import { useUser } from "@/hooks/useUser";
import axiosClient from "@/utils/axios";

/**
 * Change avatar for any logged-in user (email or Google).
 * Uploads cropped image → Nest → S3 WebP.
 */
export default function AvatarSettings({ compact = false }) {
  const { user, refetch } = useUser();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("image", file);
      await axiosClient.post("/user/avatar", form);
      await refetch();
      setMessage("Photo updated.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not upload photo.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={compact ? "mt-4" : "mt-5"}>
      {!compact ? (
        <>
          <div className="mb-4 h-px w-full bg-gray-200" />
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Profile photo
          </h2>
        </>
      ) : null}
      <ProfilePictureUploader
        value={user?.avatar || user?.avatar_url || null}
        onChange={handleFile}
        disabled={saving}
        label={saving ? "Uploading…" : "Change photo"}
      />
      {message ? (
        <p className="mt-2 text-center text-sm text-green-600">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-center text-sm text-red-600">
          {Array.isArray(error) ? error.join(", ") : String(error)}
        </p>
      ) : null}
    </div>
  );
}
