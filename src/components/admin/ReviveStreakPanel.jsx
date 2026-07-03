"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, HeartPulse } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageLibrarySelect from "@/components/admin/ImageLibrarySelect";
import NotificationPreview from "@/components/admin/NotificationPreview";
import { useAdminUsers } from "@/hooks/useAdminTestSend";
import { useReviveStreak, useUserStreakStatus } from "@/hooks/useAdminActions";
import {
  resolvePreviewImage,
  useLocalNotificationPreview,
} from "@/hooks/useNotificationPreview";
import { stripHtml } from "@/utils/renderTemplate";

const STATUS_STYLES = {
  active: "text-emerald-300 bg-emerald-500/15",
  at_risk: "text-amber-300 bg-amber-500/15",
  broken: "text-red-300 bg-red-500/15",
  none: "text-gray-400 bg-white/10",
};

const REVIVE_FALLBACK_BODY =
  "<p>We restored your {{streak}}-day streak. Thank you for using Pomopal — let's keep it going!</p>";

export default function ReviveStreakPanel({ templates = [] }) {
  const [userSearch, setUserSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [selectedImageKey, setSelectedImageKey] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState(null);

  const { data: users = [] } = useAdminUsers(userSearch, true);
  const { data: streakStatus, isLoading: statusLoading } = useUserStreakStatus(userId);
  const revive = useReviveStreak();

  const announcementTemplates = useMemo(
    () => templates.filter((t) => t.type === "announcement" || t.type === "streak_milestone"),
    [templates],
  );

  useEffect(() => {
    if (!templateId) return;
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    setTitle(t.title);
    setBody(t.body);
    setConfirmed(false);
  }, [templateId, templates]);

  const streakContext = useMemo(
    () => ({ streak: streakStatus?.current_streak ?? 7 }),
    [streakStatus?.current_streak],
  );

  const localPreview = useLocalNotificationPreview({
    templateId: templateId || undefined,
    templates,
    title,
    body,
    type: "announcement",
    context: streakContext,
    fallbackTitle: "Streak restored",
    fallbackBody: REVIVE_FALLBACK_BODY,
  });

  const previewImage = resolvePreviewImage({
    selectedImageKey,
    templateImageUrl: localPreview?.imageUrl,
  });

  const selectedUser = users.find((u) => u.id === userId);
  const canRevive = streakStatus?.eligible === true;

  const handleRevive = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("Select a user");
      return;
    }
    if (!canRevive) {
      alert(streakStatus?.reason || "User is not eligible for revive");
      return;
    }
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    setResult(null);
    try {
      const payload = {
        userId,
        sendEmail,
        ...(templateId ? { templateId } : {}),
        ...(!templateId && title.trim() ? { title: title.trim() } : {}),
        ...(!templateId && stripHtml(body) ? { body } : {}),
        ...(selectedImageKey ? { image_key: selectedImageKey } : {}),
      };

      const res = await revive.mutateAsync(payload);
      setResult(res);
      setConfirmed(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Revive failed");
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-medium flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-rose-400" />
          Revive a streak
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Only users with a broken streak (displayed as 0) can be revived. Active or at-risk streaks are skipped.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form onSubmit={handleRevive} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">User</label>
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by email or name"
                className="bg-white/10 text-white"
              />
              <select
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setResult(null);
                  setConfirmed(false);
                }}
                className="w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
              >
                <option value="" className="bg-gray-900">Select a user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-gray-900">
                    {u.email} ({u.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Streak status</label>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 min-h-[88px] text-sm">
                {!userId ? (
                  <p className="text-gray-500">Select a user to check eligibility</p>
                ) : statusLoading ? (
                  <p className="text-gray-500">Checking…</p>
                ) : streakStatus ? (
                  <div className="space-y-2">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[streakStatus.status] ?? STATUS_STYLES.none}`}>
                      {streakStatus.status.replace("_", " ")}
                    </span>
                    <p className="text-gray-300">{streakStatus.reason}</p>
                    <p className="text-gray-500 text-xs">
                      Stored: {streakStatus.current_streak} day(s) · Displayed: {streakStatus.displayed_streak}
                      {streakStatus.last_active_date ? ` · Last active ${streakStatus.last_active_date}` : ""}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Template (optional)</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
            >
              <option value="" className="bg-gray-900">Custom message</option>
              {announcementTemplates.map((t) => (
                <option key={t.id} value={t.id} className="bg-gray-900">
                  {t.name} ({t.type})
                </option>
              ))}
            </select>
          </div>

          {!templateId && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Email title</label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setConfirmed(false);
                  }}
                  placeholder="Streak restored"
                  className="bg-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Email body</label>
                <RichTextEditor
                  value={body}
                  onChange={(html) => {
                    setBody(html);
                    setConfirmed(false);
                  }}
                  placeholder="We restored your {{streak}}-day streak…"
                />
              </div>
            </>
          )}

          <ImageLibrarySelect
            value={selectedImageKey}
            onChange={(key) => {
              setSelectedImageKey(key);
              setConfirmed(false);
            }}
            noneLabel="No image (optional)"
          />

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="rounded" />
            Send email after revive
          </label>

          {!confirmed ? (
            <Button
              type="submit"
              disabled={!userId || !canRevive || !localPreview}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm"
            >
              <Eye className="w-4 h-4" />
              Review preview &amp; confirm
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={revive.isPending || !userId || !canRevive}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-sm"
            >
              <HeartPulse className="w-4 h-4" />
              {revive.isPending ? "Reviving…" : `Confirm revive${selectedUser ? ` for ${selectedUser.email}` : ""}`}
            </Button>
          )}
        </form>

        <NotificationPreview
          title={localPreview?.title}
          body={localPreview?.body}
          imageUrl={previewImage}
          type={localPreview?.type ?? "announcement"}
        />
      </div>

      {result && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          Restored {result.current_streak}-day streak for {result.user?.email}
        </div>
      )}
    </section>
  );
}
