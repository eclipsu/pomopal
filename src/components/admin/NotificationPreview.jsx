"use client";

import { mediaUrl } from "@/utils/mediaUrl";
import { hasPreviewContent, stripHtml } from "@/utils/renderTemplate";

const TYPE_META = {
  announcement: { emoji: "📢", bg: "bg-[#ddf4ff]", ring: "ring-[#84d8ff]" },
  streak_update: { emoji: "🔥", bg: "bg-[#fff4e5]", ring: "ring-[#ffc800]" },
  streak_at_risk: { emoji: "🔥", bg: "bg-[#fff4e5]", ring: "ring-[#ffc800]" },
  streak_milestone: { emoji: "🏆", bg: "bg-[#ddf4ff]", ring: "ring-[#1cb0f6]" },
  daily_nudge: { emoji: "⏱", bg: "bg-[#e5f8d0]", ring: "ring-[#89e219]" },
  comeback: { emoji: "🍅", bg: "bg-[#ffdfe0]", ring: "ring-[#ff4b4b]" },
  focus_complete: { emoji: "✅", bg: "bg-[#e5f8d0]", ring: "ring-[#58cc02]" },
};

const SAMPLE_WEEK = [
  { label: "Sa", completed: true },
  { label: "Su", completed: true, highlight: true },
  { label: "Mo", completed: true },
  { label: "Tu", completed: true },
  { label: "We", completed: true },
  { label: "Th", completed: false },
  { label: "Fr", completed: false, today: true },
];

function NonDragImg({ src, alt = "", className = "" }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className={`select-none [-webkit-user-drag:none] pointer-events-none ${className}`}
    />
  );
}

function InAppPreview({ title, plainBody, type }) {
  const meta = TYPE_META[type] ?? {
    emoji: "🔔",
    bg: "bg-[#f0f0f0]",
    ring: "ring-[#e5e5e5]",
  };
  return (
    <div className="bg-[#f7fcf0] px-3 py-3.5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#afafaf]">
        In-app
      </p>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ring-2 ring-inset ${meta.bg} ${meta.ring}`}
        >
          {meta.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-[#3c3c3c]">
              {title || "Title"}
            </p>
            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#58cc02]" />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-[#777777] line-clamp-3 whitespace-pre-wrap">
            {plainBody || "Body text"}
          </p>
          <p className="mt-1.5 text-xs font-medium text-[#afafaf]">just now</p>
        </div>
      </div>
    </div>
  );
}

function DayCircle({ day }) {
  if (day.completed && day.highlight) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff9600] text-sm font-bold text-white">
        ✓
      </div>
    );
  }
  if (day.completed) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1cb0f6] text-sm font-bold text-white">
        ✓
      </div>
    );
  }
  if (day.today) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[#ff9600] bg-white text-sm font-bold text-[#ff9600]">
        !
      </div>
    );
  }
  return <div className="h-9 w-9 rounded-full bg-[#e5e5e5]" />;
}

function StreakEmailPreview({ title, plainBody, imageUrl, type, showProgress = true }) {
  const footer =
    type === "streak_milestone"
      ? "You're on fire — keep it going tomorrow!"
      : "Keep your streak alive with a pomodoro!";

  return (
    <div className="bg-white px-5 py-8 text-center">
      <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.14em] text-[#afafaf]">
        Email · Streak update
      </p>

      <p className="text-[22px] font-extrabold tracking-tight text-[#e53e3e]">
        pomopal
      </p>

      {imageUrl ? (
        <NonDragImg
          src={imageUrl}
          className="mx-auto mt-5 max-h-28 w-auto object-contain"
        />
      ) : (
        <p className="mt-5 text-5xl">🍅</p>
      )}

      <h3 className="mt-6 text-[22px] font-extrabold leading-snug text-[#3c3c3c]">
        {title || "Keep your streak going?"}
      </h3>
      {plainBody ? (
        <p className="mt-2 text-sm leading-relaxed text-[#777777]">{plainBody}</p>
      ) : null}

      <button
        type="button"
        className="mt-6 rounded-2xl border-b-4 border-[#1899d6] bg-[#1cb0f6] px-7 py-3.5 text-[13px] font-extrabold uppercase tracking-wide text-white"
      >
        Start a pomodoro
      </button>

      {showProgress ? (
        <>
          <p className="mt-10 text-lg font-extrabold text-[#3c3c3c]">
            Your weekly progress
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {SAMPLE_WEEK.map((day) => (
              <div key={day.label} className="flex w-9 flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-[#afafaf]">{day.label}</span>
                <DayCircle day={day} />
              </div>
            ))}
          </div>
        </>
      ) : null}

      <p className="mt-6 text-sm text-[#afafaf]">{footer}</p>
    </div>
  );
}

function EmailPreview({ title, body, imageUrl }) {
  return (
    <div className="bg-white px-6 py-8 text-center">
      <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.14em] text-[#afafaf]">
        Email
      </p>
      <div className="mb-6">
        <span className="text-4xl">🍅</span>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e53e3e]">
          Pomopal
        </p>
      </div>
      {imageUrl && (
        <NonDragImg
          src={imageUrl}
          className="mx-auto mb-6 max-h-28 w-auto object-contain"
        />
      )}
      <h3 className="text-lg font-bold leading-tight text-[#3c3c3c]">
        {title || "Title"}
      </h3>
      <div
        className="mt-3 text-center text-sm leading-relaxed text-[#777777] [&_a]:text-[#e53e3e] [&_ul]:inline-block [&_ul]:list-disc [&_ul]:text-left"
        dangerouslySetInnerHTML={{
          __html: body || "<p>Body text</p>",
        }}
      />
    </div>
  );
}

export default function NotificationPreview({
  title,
  body,
  imageUrl,
  type = "announcement",
  showProgress = true,
  emptyMessage = "Fill in the message to see a preview",
}) {
  const resolvedImage = imageUrl ? mediaUrl(imageUrl) : null;
  const plainBody = stripHtml(body || "");
  const show = hasPreviewContent(title, body);
  const isStreakUpdate =
    type === "streak_update" ||
    type === "streak_at_risk" ||
    type === "streak_milestone";

  if (!show) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">{emptyMessage}</div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">Preview</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <InAppPreview title={title} plainBody={plainBody} type={type} />
        {isStreakUpdate ? (
          <StreakEmailPreview
            title={title}
            plainBody={plainBody}
            imageUrl={resolvedImage}
            type={type}
            showProgress={showProgress}
          />
        ) : (
          <EmailPreview title={title} body={body} imageUrl={resolvedImage} />
        )}
      </div>
    </div>
  );
}
