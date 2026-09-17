"use client";

import { mediaUrl } from "@/utils/mediaUrl";
import { hasPreviewContent, stripHtml } from "@/utils/renderTemplate";

const SAMPLE_WEEK = [
  { label: "Sa", completed: true },
  { label: "Su", completed: true, highlight: true },
  { label: "Mo", completed: true },
  { label: "Tu", completed: true },
  { label: "We", completed: true },
  { label: "Th", completed: false },
  { label: "Fr", completed: false, today: true },
];

const SAMPLE_BOARD = [
  { rank: 1, name: "Maya", minutes: "5h 10m" },
  { rank: 2, name: "Alex", minutes: "4h 25m" },
  { rank: 3, name: "Sam", minutes: "4h" },
  { rank: 4, name: "Jordan", minutes: "3h 18m" },
  { rank: 5, name: "Riley", minutes: "2h 55m" },
  { rank: 15, name: "You", minutes: "1h 35m", isYou: true, gapBefore: true },
];

function rankBadgeClass(rank) {
  if (rank === 1) return "bg-[#ffc800] text-[#3c3c3c]";
  if (rank === 2) return "bg-[#e5e5e5] text-[#3c3c3c]";
  if (rank === 3) return "bg-[#ff9600] text-white";
  return "bg-[#f0f0f0] text-[#777777]";
}

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
      : type === "daily_nudge"
        ? "A short focus session is enough to get back into rhythm."
        : type === "comeback"
          ? "We're glad you're here — start with one pomodoro."
          : type === "announcement"
            ? "Thanks for being part of pomopal."
            : "Keep your streak alive with a pomodoro!";

  const canShowProgress =
    showProgress &&
    (type === "streak_update" ||
      type === "streak_at_risk" ||
      type === "streak_milestone" ||
      type === "daily_nudge" ||
      type === "comeback");

  return (
    <div className="bg-white px-5 py-8 text-center">
      <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.14em] text-[#afafaf]">
        Email
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
        {type === "announcement" ? "Open pomopal" : "Start a pomodoro"}
      </button>

      {canShowProgress ? (
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

function LeaderboardEmailPreview({
  title,
  plainBody,
  imageUrl,
  type,
  showLeaderboard = true,
}) {
  const footer =
    type === "global_top"
      ? "Defend your spot — the board resets every week."
      : type === "rank_passed"
        ? "One more pomodoro can flip the board again."
        : "Climb the board with another pomodoro!";

  return (
    <div className="bg-white px-5 py-8 text-center">
      <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.14em] text-[#afafaf]">
        Email · Leaderboard
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
        <p className="mt-5 text-5xl">👑</p>
      )}

      <h3 className="mt-6 text-[22px] font-extrabold leading-snug text-[#3c3c3c]">
        {title || "Your week in focus"}
      </h3>
      {plainBody ? (
        <p className="mt-2 text-sm leading-relaxed text-[#777777]">{plainBody}</p>
      ) : null}

      <button
        type="button"
        className="mt-6 rounded-2xl border-b-4 border-[#1899d6] bg-[#1cb0f6] px-7 py-3.5 text-[13px] font-extrabold uppercase tracking-wide text-white"
      >
        View leaderboard
      </button>

      {showLeaderboard ? (
        <>
          <p className="mt-10 text-lg font-extrabold text-[#3c3c3c]">
            This week&apos;s leaderboard
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border-2 border-[#e5e5e5] text-left">
            {SAMPLE_BOARD.map((row) => (
              <div key={row.rank}>
                {row.gapBefore ? (
                  <div className="bg-[#fafafa] py-2 text-center text-sm font-extrabold tracking-[0.25em] text-[#afafaf]">
                    ···
                  </div>
                ) : null}
              <div
                className={`flex items-center gap-3 border-b border-[#f0f0f0] px-3 py-2.5 last:border-0 ${
                  row.isYou ? "bg-[#ddf4ff]" : "bg-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${rankBadgeClass(row.rank)}`}
                >
                  {row.rank}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-sm font-bold ${
                    row.isYou ? "text-[#1cb0f6]" : "text-[#3c3c3c]"
                  }`}
                >
                  {row.name}
                  {row.isYou ? (
                    <span className="ml-1.5 inline-block rounded-full bg-[#1cb0f6] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                      You
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-sm font-extrabold text-[#3c3c3c]">
                  {row.minutes}
                </span>
              </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <p className="mt-6 text-sm text-[#afafaf]">{footer}</p>
    </div>
  );
}

export default function NotificationPreview({
  title,
  body,
  imageUrl,
  type = "announcement",
  showProgress = true,
  showLeaderboard = true,
  emptyMessage = "Fill in the message to see a preview",
}) {
  const resolvedImage = imageUrl ? mediaUrl(imageUrl) : null;
  const plainBody = stripHtml(body || "");
  const show = hasPreviewContent(title, body);
  const isLeaderboard =
    type === "weekly_rank" ||
    type === "rank_passed" ||
    type === "global_top";

  if (!show) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">{emptyMessage}</div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-gray-500">Preview</p>
      <div className="overflow-hidden rounded-xl border border-white/10">
        {isLeaderboard ? (
          <LeaderboardEmailPreview
            title={title}
            plainBody={plainBody}
            imageUrl={resolvedImage}
            type={type}
            showLeaderboard={showLeaderboard}
          />
        ) : (
          <StreakEmailPreview
            title={title}
            plainBody={plainBody}
            imageUrl={resolvedImage}
            type={type}
            showProgress={showProgress}
          />
        )}
      </div>
    </div>
  );
}
