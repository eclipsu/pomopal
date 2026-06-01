/** Relative "last active" label from an ISO timestamp. */
export function formatLastActive(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function formatPresenceSubtitle(presence) {
  const status = presence?.status ?? "offline";
  if (status === "online") return "Active now";
  if (presence?.custom_status) return presence.custom_status;
  const last = formatLastActive(presence?.last_seen_at);
  if (last) return `Last active ${last}`;
  return status === "idle" ? "Idle" : "Offline";
}
