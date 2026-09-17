"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ImageLibrarySelect from "@/components/admin/ImageLibrarySelect";
import EligibilityRulesHelp from "@/components/admin/EligibilityRulesHelp";
import RichTextEditor from "@/components/admin/RichTextEditor";
import NotificationPreview from "@/components/admin/NotificationPreview";
import { renderTemplate } from "@/utils/renderTemplate";
import { NOTIFICATION_TYPE_OPTIONS } from "@/constants/notificationTypes";

const SAMPLE_CONTEXT = {
  streak: 7,
  daysAway: 5,
  today: new Date().toISOString().slice(0, 10),
  username: "Rajeev",
  minutes: 25,
  goal: 25,
  totalMinutes: 500,
  weekMinutes: 120,
  weekSessions: 6,
  rank: 15,
  rankLabel: "#15",
  otherName: "Alex",
};

const NOTIFICATION_TYPES = NOTIFICATION_TYPE_OPTIONS;

const emptyForm = {
  name: "",
  type: "streak_update",
  title: "Keep your streak going?",
  body: "Your streak is on grace — one pomodoro today keeps it alive.",
  eligibility_rules: "{}",
  showProgress: true,
  showLeaderboard: true,
  active: true,
};

function supportsWeeklyProgress(type) {
  return (
    type === "streak_update" ||
    type === "streak_at_risk" ||
    type === "streak_milestone" ||
    type === "daily_nudge" ||
    type === "comeback"
  );
}

function supportsLeaderboardGraphic(type) {
  return (
    type === "weekly_rank" ||
    type === "rank_passed" ||
    type === "global_top"
  );
}

function showProgressFromRules(rules, type) {
  if (!supportsWeeklyProgress(type)) return false;
  if (rules && typeof rules.showProgress === "boolean") return rules.showProgress;
  return true;
}

function showLeaderboardFromRules(rules, type) {
  if (!supportsLeaderboardGraphic(type)) return false;
  if (rules && typeof rules.showLeaderboard === "boolean") {
    return rules.showLeaderboard;
  }
  return true;
}

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
      const rules = initial.eligibility_rules ?? {};
      const type = initial.type ?? "daily_nudge";
      const { showProgress: _ignored, showLeaderboard: _ignoredBoard, ...eligibilityOnly } =
        rules;
      setForm({
        name: initial.name ?? "",
        type,
        title: initial.title ?? "",
        body: initial.body ?? "",
        eligibility_rules: JSON.stringify(eligibilityOnly, null, 2),
        showProgress: showProgressFromRules(rules, type),
        showLeaderboard: showLeaderboardFromRules(rules, type),
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

    if (supportsWeeklyProgress(form.type)) {
      rules = { ...rules, showProgress: Boolean(form.showProgress) };
    } else if (rules && "showProgress" in rules) {
      const { showProgress: _drop, ...rest } = rules;
      rules = rest;
    }

    if (supportsLeaderboardGraphic(form.type)) {
      rules = { ...rules, showLeaderboard: Boolean(form.showLeaderboard) };
    } else if (rules && "showLeaderboard" in rules) {
      const { showLeaderboard: _drop, ...rest } = rules;
      rules = rest;
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
            onChange={(e) => {
              const type = e.target.value;
              setForm((prev) => ({
                ...prev,
                type,
                showProgress: supportsWeeklyProgress(type)
                  ? prev.showProgress ?? true
                  : false,
                showLeaderboard: supportsLeaderboardGraphic(type)
                  ? prev.showLeaderboard ?? true
                  : false,
              }));
            }}
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

      {supportsWeeklyProgress(form.type) && (
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={form.showProgress}
            onChange={(e) => update("showProgress", e.target.checked)}
            className="rounded"
          />
          Include weekly progress
          <span className="text-xs text-gray-500">
            (day circles under the email CTA)
          </span>
        </label>
      )}

      {supportsLeaderboardGraphic(form.type) && (
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={form.showLeaderboard}
            onChange={(e) => update("showLeaderboard", e.target.checked)}
            className="rounded"
          />
          Include leaderboard graphic
          <span className="text-xs text-gray-500">
            (ranked list under the email CTA)
          </span>
        </label>
      )}

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
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-400 space-y-1.5">
          <p className="font-medium text-gray-300">If / else in title or body</p>
          <code className="block whitespace-pre-wrap text-gray-400">
            {`{{#if streak > 7}}You're on a roll, {{username}}!{{else}}One day at a time.{{/if}}`}
          </code>
          <code className="block whitespace-pre-wrap text-gray-400">
            {`{{#if streak > 30}}Legend{{else if streak > 7}}Solid{{else}}Starting{{/if}}`}
          </code>
          <p className="font-medium text-gray-300 pt-1">Randomize</p>
          <code className="block whitespace-pre-wrap text-gray-400">
            {`{{randomize{You're crushing it!|Keep going!|One more pomodoro!}}}`}
          </code>
          <code className="block whitespace-pre-wrap text-gray-400">
            {`{{#randomize}}Option A{{or}}Option B{{or}}Option C{{/randomize}}`}
          </code>
          <p>
            Rank: prefer{" "}
            <code className="text-gray-300">{"{{rankLabel}}"}</code> (e.g. #15)
            or <code className="text-gray-300">{"{{rank}}"}</code> alone — avoid
            a bare <code className="text-gray-300">#</code> with empty rank.
          </p>
        </div>
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
        showProgress={form.showProgress}
        showLeaderboard={form.showLeaderboard}
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
