"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useAdminUsers, useTestSendNotification } from "@/hooks/useAdminTestSend";

const NOTIFICATION_TYPES = [
  { value: "streak_at_risk", label: "Streak at risk" },
  { value: "streak_milestone", label: "Streak milestone" },
  { value: "daily_nudge", label: "Daily nudge" },
  { value: "comeback", label: "Comeback" },
  { value: "announcement", label: "Announcement" },
  { value: "focus_complete", label: "Focus complete" },
];

export default function TestSendPanel({ templates = [] }) {
  const [userSearch, setUserSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("daily_nudge");
  const [templateId, setTemplateId] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [streak, setStreak] = useState("7");
  const [daysAway, setDaysAway] = useState("5");
  const [isLastChance, setIsLastChance] = useState(false);
  const [result, setResult] = useState(null);

  const { data: users = [], isLoading: usersLoading } = useAdminUsers(userSearch, true);
  const testSend = useTestSendNotification();

  const templatesForType = useMemo(
    () => templates.filter((t) => t.type === type),
    [templates, type],
  );

  const selectedUser = users.find((u) => u.id === userId);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("Select a user");
      return;
    }
    setResult(null);
    try {
      const payload = {
        userId,
        type,
        sendEmail,
        streak: Number(streak) || 7,
        daysAway: Number(daysAway) || 5,
        isLastChance,
      };
      if (templateId) payload.templateId = templateId;
      const res = await testSend.mutateAsync(payload);
      setResult(res);
    } catch (err) {
      alert(err?.response?.data?.message || "Test send failed");
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-medium">Test send</h2>
        <p className="text-sm text-gray-400 mt-1">
          Send a one-off notification to a user. Bypasses preferences and dedupe.
        </p>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Find user</label>
            <Input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by email or name"
              className="bg-white/10 text-white"
            />
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
              required
            >
              <option value="" className="bg-gray-900">
                {usersLoading ? "Loading users..." : "Select a user"}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-gray-900">
                  {u.email} ({u.name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Notification type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setTemplateId("");
              }}
              className="w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
            >
              {NOTIFICATION_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-gray-900">
                  {t.label}
                </option>
              ))}
            </select>

            <label className="text-sm font-medium text-gray-300">Template (optional)</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
            >
              <option value="" className="bg-gray-900">
                Auto-pick eligible template
              </option>
              {templatesForType.map((t) => (
                <option key={t.id} value={t.id} className="bg-gray-900">
                  {t.name}
                  {!t.active ? " (inactive)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Streak</label>
            <Input
              type="number"
              min={0}
              value={streak}
              onChange={(e) => setStreak(e.target.value)}
              className="bg-white/10 text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Days away</label>
            <Input
              type="number"
              min={0}
              value={daysAway}
              onChange={(e) => setDaysAway(e.target.value)}
              className="bg-white/10 text-white"
            />
          </div>
          <label className="flex items-end gap-2 text-sm text-gray-300 pb-2">
            <input
              type="checkbox"
              checked={isLastChance}
              onChange={(e) => setIsLastChance(e.target.checked)}
              className="rounded"
            />
            11pm last chance
          </label>
          <label className="flex items-end gap-2 text-sm text-gray-300 pb-2">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="rounded"
            />
            Send email too
          </label>
        </div>

        <Button
          type="submit"
          disabled={testSend.isPending || !userId}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
        >
          <Send className="w-4 h-4" />
          {testSend.isPending ? "Sending..." : "Send test notification"}
        </Button>
      </form>

      {result && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm space-y-1">
          <p className="text-emerald-300 font-medium">Sent to {selectedUser?.email ?? userId}</p>
          <p>
            <span className="text-gray-400">Source:</span>{" "}
            {result.source === "template"
              ? `template "${result.templateName}"`
              : "hardcoded fallback"}
          </p>
          <p>
            <span className="text-gray-400">Title:</span> {result.title}
          </p>
          <p>
            <span className="text-gray-400">Body:</span> {result.body}
          </p>
          <p className="text-gray-500 text-xs">
            Email {result.emailSent ? "sent" : "skipped (SMTP off or unchecked)"}
          </p>
        </div>
      )}
    </section>
  );
}
