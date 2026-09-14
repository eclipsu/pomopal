"use client";

import { mediaUrl } from "@/utils/mediaUrl";
import { hasPreviewContent, stripHtml } from "@/utils/renderTemplate";

const TYPE_ICON = {
  announcement: "📢",
  streak_at_risk: "🔥",
  streak_milestone: "🏆",
  daily_nudge: "⏱",
  comeback: "🍅",
  focus_complete: "✅",
};

function InAppPreview({ title, plainBody, type }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1d24] overflow-hidden">
      <p className="text-[10px] uppercase tracking-wide text-gray-500 px-3 py-2 border-b border-white/5">
        In-app
      </p>
      <div className="px-3 py-3">
        <div className="flex gap-2 items-start">
          <span className="text-base shrink-0">{TYPE_ICON[type] ?? "🔔"}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white font-medium truncate">{title || "Title"}</p>
            <p className="text-xs text-gray-500 line-clamp-3 mt-0.5 whitespace-pre-wrap">
              {plainBody || "Body text"}
            </p>
            <p className="text-[10px] text-gray-600 mt-1">just now</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ title, body, imageUrl }) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <p className="text-[10px] uppercase tracking-wide text-gray-500 px-3 py-2 border-b border-white/5 bg-white/5">
        Email
      </p>
      <div className="bg-[#f4f4f5] p-4">
        <div className="mx-auto max-w-[320px] rounded-2xl bg-white overflow-hidden shadow-sm">
          <div className="h-1 bg-[#e53e3e]" />
          <div className="px-6 py-8 text-center">
            <div className="mb-6">
              <span className="text-4xl">🍅</span>
              <p className="mt-2 text-[11px] font-semibold tracking-[0.2em] text-[#e53e3e] uppercase">
                Pomopal
              </p>
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="mx-auto mb-6 max-h-28 w-auto object-contain"
              />
            )}
            <h3 className="text-lg font-bold text-gray-900 leading-tight">
              {title || "Title"}
            </h3>
            <div
              className="mt-3 text-sm text-gray-600 leading-relaxed text-center [&_a]:text-[#e53e3e] [&_ul]:list-disc [&_ul]:text-left [&_ul]:inline-block"
              dangerouslySetInnerHTML={{
                __html: body || "<p>Body text</p>",
              }}
            />
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-center text-[10px] text-gray-400 leading-relaxed">
            You&apos;re getting this because you have notifications enabled on Pomopal.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationPreview({
  title,
  body,
  imageUrl,
  type = "announcement",
  emptyMessage = "Fill in the message to see a preview",
}) {
  const resolvedImage = imageUrl ? mediaUrl(imageUrl) : null;
  const plainBody = stripHtml(body || "");
  const show = hasPreviewContent(title, body);

  if (!show) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">Preview</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InAppPreview title={title} plainBody={plainBody} type={type} />
        <EmailPreview title={title} body={body} imageUrl={resolvedImage} />
      </div>
    </div>
  );
}
