"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ImageLibrarySelect from "@/components/admin/ImageLibrarySelect";
import EligibilityRulesHelp from "@/components/admin/EligibilityRulesHelp";
import RichTextEditor from "@/components/admin/RichTextEditor";
import NotificationPreview from "@/components/admin/NotificationPreview";
import { renderTemplate } from "@/utils/renderTemplate";

const SAMPLE_CONTEXT = {
  streak: 7,
  daysAway: 5,
  today: new Date().toISOString().slice(0, 10),
};

const NOTIFICATION_TYPES = [
  { value: "streak_at_risk", label: "Streak at risk" },
  { value: "streak_milestone", label: "Streak milestone" },
  { value: "daily_nudge", label: "Daily nudge" },
  { value: "comeback", label: "Comeback" },
  { value: "announcement", label: "Announcement" },
  { value: "focus_complete", label: "Focus complete" },
];

const emptyForm = {
  name: "",
  type: "daily_nudge",
  title: "",
  body: "",
  eligibility_rules: "{}",
  active: true,
};

function imageKeyFromValue(value) {
  if (!value) return null;
  if (value.startsWith("notification-templates/")) return value;
  const match = String(value).match(/notification-templates\/[0-9a-f-]+\.webp/i);
  return match ? match[0] : null;
}

export default function TemplateForm({ initial, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [selectedImageKey, setSelectedImageKey] = useState(null);
  const [clearImage, setClearImage] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name ?? "",
        type: initial.type ?? "daily_nudge",
        title: initial.title ?? "",
        body: initial.body ?? "",
        eligibility_rules: JSON.stringify(initial.eligibility_rules ?? {}, null, 2),
        active: initial.active ?? true,
      });
      setSelectedImageKey(imageKeyFromValue(initial.image_url));
      setClearImage(false);
    } else {
      setForm(emptyForm);
      setSelectedImageKey(null);
      setClearImage(false);
    }
    setSubmitError(null);
  }, [initial]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const previewTitle = useMemo(
    () => renderTemplate(form.title, SAMPLE_CONTEXT),
    [form.title],
  );
  const previewBody = useMemo(
    () => renderTemplate(form.body, SAMPLE_CONTEXT),
    [form.body],
  );

  const previewImageUrl = useMemo(() => {
    if (clearImage) return null;
    if (selectedImageKey) return selectedImageKey;
    if (initial?.image_url && !selectedImageKey && !clearImage) return initial.image_url;
    return null;
  }, [clearImage, selectedImageKey, initial?.image_url]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    let rules;
    try {
      rules = form.eligibility_rules.trim() ? JSON.parse(form.eligibility_rules) : {};
    } catch {
      setSubmitError("Eligibility rules must be valid JSON");
      return;
    }

    let imageKey;
    if (clearImage) {
      imageKey = "";
    } else if (selectedImageKey) {
      const initialKey = imageKeyFromValue(initial?.image_url);
      if (!initial || selectedImageKey !== initialKey) {
        imageKey = selectedImageKey;
      }
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      title: form.title.trim(),
      body: form.body.trim() || "<p></p>",
      active: form.active,
      eligibility_rules: rules,
      ...(imageKey !== undefined ? { image_key: imageKey } : {}),
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to save template");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Name</label>
          <Input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="bg-white/10 text-white"
            placeholder="e.g. Evening streak reminder"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Type</label>
          <select
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            className="w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm"
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-gray-900">
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Title</label>
        <Input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className="bg-white/10 text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Body</label>
        <RichTextEditor value={form.body} onChange={(html) => update("body", html)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Eligibility rules (JSON)</label>
          <textarea
            value={form.eligibility_rules}
            onChange={(e) => update("eligibility_rules", e.target.value)}
            rows={10}
            className="w-full rounded-md border border-white/20 bg-white/10 text-white px-3 py-2 text-sm font-mono"
            placeholder='{"minStreak": 3}'
          />
          <p className="text-xs text-gray-500">Must be valid JSON. Use {"{}"} for no filters.</p>
        </div>
        <EligibilityRulesHelp />
      </div>

      <ImageLibrarySelect
        value={clearImage ? null : selectedImageKey}
        onChange={(key) => {
          setSelectedImageKey(key);
          setClearImage(!key);
        }}
        noneLabel="No image (optional)"
      />

      {initial?.image_url && !clearImage && (
        <button
          type="button"
          onClick={() => {
            setClearImage(true);
            setSelectedImageKey(null);
          }}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Remove current image
        </button>
      )}

      {submitError && <p className="text-sm text-red-400">{submitError}</p>}

      <NotificationPreview
        title={previewTitle}
        body={previewBody}
        imageUrl={previewImageUrl}
        type={form.type}
        emptyMessage="Add a title and body to preview this template"
      />

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => update("active", e.target.checked)}
          className="rounded"
        />
        Active (used when sending notifications)
      </label>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          {saving ? "Saving..." : initial ? "Update template" : "Create template"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
