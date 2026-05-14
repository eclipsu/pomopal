"use client";

import { useState } from "react";
import { useFriends } from "@/hooks/useFriends";

export default function SendInviteModal({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { sendInvite } = useFriends();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      await sendInvite(email.trim());
      setStatus("success");
      setMessage(`Invite sent to ${email}`);
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err?.response?.data?.message || "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold text-lg">Add a Friend</h2>
            <p className="text-gray-400 text-sm mt-0.5">Send an invite link to their email</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors text-sm"
              autoFocus
            />
          </div>

          {/* Status message */}
          {status && (
            <div
              className={`rounded-xl px-4 py-3 text-sm ${
                status === "success"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {status === "success" ? "✓ " : "✕ "}
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl py-3 text-sm transition-colors"
          >
            {loading ? "Sending..." : "Send Invite"}
          </button>
        </form>
      </div>
    </div>
  );
}
