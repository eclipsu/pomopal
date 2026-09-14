/** Shared admin + bell labels for notification types. */
export const NOTIFICATION_TYPE_OPTIONS = [
  { value: "streak_update", label: "Streak update" },
  { value: "streak_at_risk", label: "Streak at risk" },
  { value: "streak_milestone", label: "Streak milestone" },
  { value: "daily_nudge", label: "Daily nudge" },
  { value: "comeback", label: "Comeback" },
  { value: "focus_complete", label: "Focus complete" },
  { value: "daily_goal", label: "Daily goal" },
  { value: "focus_milestone", label: "Focus milestone" },
  { value: "weekly_rank", label: "Weekly rank" },
  { value: "rank_passed", label: "Rank passed" },
  { value: "global_top", label: "Global top" },
  { value: "announcement", label: "Announcement" },
];

export const NOTIFICATION_TYPE_META = {
  announcement: { emoji: "📢", bg: "bg-[#ddf4ff]", ring: "ring-[#84d8ff]" },
  streak_update: { emoji: "🔥", bg: "bg-[#fff4e5]", ring: "ring-[#ffc800]" },
  streak_at_risk: { emoji: "🔥", bg: "bg-[#fff4e5]", ring: "ring-[#ffc800]" },
  streak_milestone: { emoji: "🏆", bg: "bg-[#ddf4ff]", ring: "ring-[#1cb0f6]" },
  daily_nudge: { emoji: "⏱", bg: "bg-[#e5f8d0]", ring: "ring-[#89e219]" },
  comeback: { emoji: "🍅", bg: "bg-[#ffdfe0]", ring: "ring-[#ff4b4b]" },
  focus_complete: { emoji: "✅", bg: "bg-[#e5f8d0]", ring: "ring-[#58cc02]" },
  daily_goal: { emoji: "🎯", bg: "bg-[#e5f8d0]", ring: "ring-[#89e219]" },
  focus_milestone: { emoji: "💪", bg: "bg-[#ddf4ff]", ring: "ring-[#1cb0f6]" },
  weekly_rank: { emoji: "📊", bg: "bg-[#ddf4ff]", ring: "ring-[#84d8ff]" },
  rank_passed: { emoji: "📈", bg: "bg-[#fff4e5]", ring: "ring-[#ff9600]" },
  global_top: { emoji: "👑", bg: "bg-[#fff4e5]", ring: "ring-[#ffc800]" },
};
