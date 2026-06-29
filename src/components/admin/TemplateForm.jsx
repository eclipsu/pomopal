"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ImageDropzone from "@/components/admin/ImageDropzone";
import EligibilityRulesHelp from "@/components/admin/EligibilityRulesHelp";

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

export default function TemplateForm({ initial, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [clearImage, setClearImage] = useState(false);

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
      setImageFile(null);
      setClearImage(false);
    } else {
      setForm(emptyForm);
      setImageFile(null);
      setClearImage(false);
    }
  }, [initial]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("type", form.type);
    fd.append("title", form.title.trim());
    fd.append("body", form.body.trim());
    fd.append("active", String(form.active));
    try {
      const rules = form.eligibility_rules.trim() ? JSON.parse(form.eligibility_rules) : {};
      fd.append("eligibility_rules", JSON.stringify(rules));
    } catch {
      alert("Eligibility rules must be valid JSON");
      return;
    }
    if (imageFile) fd.append("image", imageFile);
    onSubmit(fd, clearImage);
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
        <textarea
          value={form.body}
          onChange={(e) => update("body", e.target.value)}
          rows={4}
          required
          className="w-full rounded-md border border-white/20 bg-white/10 text-white px-3 py-2 text-sm"
        />
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

      <ImageDropzone
        value={imageFile}
        previewUrl={!clearImage ? initial?.image_url : null}
        onChange={(file) => {
          setImageFile(file);
          setClearImage(false);
        }}
        onClear={() => {
          setImageFile(null);
          setClearImage(true);
        }}
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
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
