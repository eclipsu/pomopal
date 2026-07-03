"use client";

import { useMemo, useState } from "react";
import { Eye, Send, X } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import NotificationPreview from "@/components/admin/NotificationPreview";
import { useAdminUsers, useTestSendNotification } from "@/hooks/useAdminTestSend";
import { renderTemplate } from "@/utils/renderTemplate";

const SAMPLE_CONTEXT = {
  streak: 7,
  daysAway: 5,
  today: new Date().toISOString().slice(0, 10),
};

export default function TemplateTestModal({ template, onClose }) {
  const [userSearch, setUserSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState(null);

  const { data: users = [], isLoading } = useAdminUsers(userSearch, true);
  const testSend = useTestSendNotification();

  const preview = useMemo(() => {
    if (!template) return null;
    return {
      title: renderTemplate(template.title, SAMPLE_CONTEXT),
      body: renderTemplate(template.body, SAMPLE_CONTEXT),
      imageUrl: template.image_url,
      type: template.type,
    };
  }, [template]);

  if (!template) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("Select a user");
      return;
    }
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setResult(null);
    try {
      const res = await testSend.mutateAsync({
        userId,
        type: template.type,
        templateId: template.id,
        sendEmail,
        streak: 7,
        daysAway: 5,
      });
      setResult(res);
    } catch (err) {
      alert(err?.response?.data?.message || "Test send failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-gray-900 z-10">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Test template</p>
            <h3 className="font-semibold">{template.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-5 space-y-5">
          <NotificationPreview
            title={preview?.title}
            body={preview?.body}
            imageUrl={preview?.imageUrl}
            type={preview?.type}
          />

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Find user</label>
            <Input
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setConfirmed(false);
              }}
              placeholder="Search by email or name"
              className="bg-white/10 text-white"
            />
            <select
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setConfirmed(false);
              }}
              className="w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
              required
            >
              <option value="" className="bg-gray-900">
                {isLoading ? "Loading…" : "Select a user"}
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-gray-900">
                  {u.email} ({u.name})
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="rounded"
            />
            Send email too
          </label>

          <div className="flex gap-2">
            {!confirmed ? (
              <Button
                type="submit"
                disabled={!userId}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm"
              >
                <Eye className="w-4 h-4" />
                Review &amp; confirm send
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={testSend.isPending || !userId}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
              >
                <Send className="w-4 h-4" />
                {testSend.isPending ? "Sending…" : "Confirm & send test"}
              </Button>
            )}
          </div>

          {result && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              Sent — {result.title}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
