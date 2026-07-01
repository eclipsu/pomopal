"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ImageDropzone from "@/components/admin/ImageDropzone";
import EligibilityRulesHelp from "@/components/admin/EligibilityRulesHelp";
import {
  useAdminTemplateImages,
  useUploadTemplateImage,
} from "@/hooks/useAdminTemplates";

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

function labelForImage(key) {
  if (!key) return "";
  return key.replace("notification-templates/", "").replace(/\.webp$/i, "").slice(0, 8) + "…";
}

export default function TemplateForm({ initial, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [selectedImageKey, setSelectedImageKey] = useState(null);
  const [clearImage, setClearImage] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { data: libraryImages = [], isLoading: imagesLoading } = useAdminTemplateImages();
  const uploadImage = useUploadTemplateImage();

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
      setSelectedImageKey(imageKeyFromValue(initial.image_url));
      setClearImage(false);
    } else {
      setForm(emptyForm);
      setImageFile(null);
      setSelectedImageKey(null);
      setClearImage(false);
    }
    setSubmitError(null);
  }, [initial]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const selectedLibraryImage = useMemo(
    () => libraryImages.find((img) => img.key === selectedImageKey),
    [libraryImages, selectedImageKey],
  );

  const previewUrl = useMemo(() => {
    if (clearImage) return null;
    if (selectedLibraryImage?.url) return selectedLibraryImage.url;
    if (!imageFile && initial?.image_url) return initial.image_url;
    return null;
  }, [clearImage, selectedLibraryImage, imageFile, initial?.image_url]);

  const busy = saving || uploadImage.isPending;

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
    try {
      if (clearImage) {
        imageKey = "";
      } else if (imageFile) {
        const uploaded = await uploadImage.mutateAsync(imageFile);
        imageKey = uploaded.key;
        setSelectedImageKey(uploaded.key);
        setImageFile(null);
      } else if (
        selectedImageKey &&
        (!initial || selectedImageKey !== imageKeyFromValue(initial?.image_url))
      ) {
        imageKey = selectedImageKey;
      }
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Image upload failed");
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      title: form.title.trim(),
      body: form.body.trim(),
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

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300">Reuse uploaded image</label>
        <select
          value={selectedImageKey ?? ""}
          onChange={(e) => {
            const key = e.target.value || null;
            setSelectedImageKey(key);
            setImageFile(null);
            setClearImage(false);
          }}
          disabled={imagesLoading || !!imageFile || busy}
          className="w-full h-10 rounded-md border border-white/20 bg-white/10 text-white px-3 text-sm disabled:opacity-50"
        >
          <option value="" className="bg-gray-900">
            {imagesLoading ? "Loading images…" : "Choose from library (optional)"}
          </option>
          {libraryImages.map((img) => (
            <option key={img.key} value={img.key} className="bg-gray-900">
              {labelForImage(img.key)}
            </option>
          ))}
        </select>

        <p className="text-xs text-gray-500">
          Or upload a new image below. Uploads are saved immediately and appear in this list.
        </p>
      </div>

      <ImageDropzone
        value={imageFile}
        previewUrl={!imageFile ? previewUrl : null}
        onChange={(file) => {
          setImageFile(file);
          setSelectedImageKey(null);
          setClearImage(false);
        }}
        onClear={() => {
          setImageFile(null);
          setSelectedImageKey(null);
          setClearImage(true);
        }}
      />

      {submitError && <p className="text-sm text-red-400">{submitError}</p>}

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
          disabled={busy}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          {uploadImage.isPending
            ? "Uploading image..."
            : saving
              ? "Saving..."
              : initial
                ? "Update template"
                : "Create template"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
