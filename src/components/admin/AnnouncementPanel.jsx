"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Megaphone } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageLibrarySelect from "@/components/admin/ImageLibrarySelect";
import NotificationPreview from "@/components/admin/NotificationPreview";
import { useBroadcastAnnouncement } from "@/hooks/useAdminActions";
import {
  resolvePreviewImage,
  useLocalNotificationPreview,
} from "@/hooks/useNotificationPreview";
import { stripHtml } from "@/utils/renderTemplate";

export default function AnnouncementPanel({ templates = [] }) {
  const [mode, setMode] = useState("custom");
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [selectedImageKey, setSelectedImageKey] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState(null);

  const broadcast = useBroadcastAnnouncement();

  const announcementTemplates = useMemo(
    () => templates.filter((t) => t.type === "announcement"),
    [templates],
  );

  useEffect(() => {
    if (mode !== "template" || !templateId) return;
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    setTitle(t.title);
    setBody(t.body);
    setConfirmed(false);
  }, [mode, templateId, templates]);

  const localPreview = useLocalNotificationPreview({
    templateId: mode === "template" ? templateId : undefined,
    templates,
    title,
    body,
    type: "announcement",
    fallbackTitle: "Announcement",
  });

  const previewImage = resolvePreviewImage({
    selectedImageKey,
    templateImageUrl: localPreview?.imageUrl,
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (mode === "custom" && !stripHtml(body)) {
      alert("Write an announcement body");
      return;
    }
    if (mode === "template" && !templateId) {
      alert("Select a template");
      return;
    }
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    if (!confirm("Send this announcement to ALL users?")) return;

    setResult(null);
    try {
      const payload = {
        sendEmail,
        dryRun: false,
        ...(mode === "template" ? { templateId } : { title: title.trim() || "Announcement", body }),
        ...(selectedImageKey ? { image_key: selectedImageKey } : {}),
      };

      const res = await broadcast.mutateAsync(payload);
      setResult(res);
      setConfirmed(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Broadcast failed");
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-violet-400" />
          Announcement
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Preview how the notification looks in-app and in email before broadcasting.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("custom");
                setConfirmed(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm ${mode === "custom" ? "bg-violet-600 text-white" : "bg-white/10 text-gray-300"}`}
            >
              New announcement
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("template");
                setConfirmed(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm ${mode === "template" ? "bg-violet-600 text-white" : "bg-white/10 text-gray-300"}`}
            >
              Use template
            </button>
          </div>

          {mode === "template" ? (
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Announcement template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
                required
              >
                <option value="" className="bg-gray-900">Select template</option>
                {announcementTemplates.map((t) => (
                  <option key={t.id} value={t.id} className="bg-gray-900">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Title</label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setConfirmed(false);
                  }}
                  placeholder="Announcement"
                  className="bg-white/10 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Body</label>
                <RichTextEditor
                  value={body}
                  onChange={(html) => {
                    setBody(html);
                    setConfirmed(false);
                  }}
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
            Send email
          </label>

          {!confirmed ? (
            <Button
              type="submit"
              disabled={broadcast.isPending || !localPreview}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm"
            >
              <Eye className="w-4 h-4" />
              Review preview &amp; confirm
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={broadcast.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm"
            >
              <Megaphone className="w-4 h-4" />
              {broadcast.isPending ? "Sending…" : "Confirm & send to everyone"}
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
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm text-violet-100 space-y-1">
          <p className="font-medium">Broadcast complete</p>
          <p>In-app: {result.inserted} · Skipped: {result.skipped} · Emailed: {result.emailed} · Failed: {result.emailFailed}</p>
        </div>
      )}
    </section>
  );
}
