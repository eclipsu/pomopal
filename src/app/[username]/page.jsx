import Link from "next/link";
import { Flame, Trophy, Clock, User } from "lucide-react";
import { SpaceCard, SpacesPageShell } from "@/components/space/SpaceCard";
import { FocusActivityGraph } from "@/components/space/FocusActivityGraph";
import {
  fetchPublicProfile,
  privateProfileMetadata,
  profileShareMetadata,
} from "@/lib/seo";

/** ISR — regenerate public profiles at most every 12 hours. */
export const revalidate = 12 * 60 * 60;

function formatFocusMinutes(minutes) {
  if (minutes == null) return null;
  const m = Math.round(minutes);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  return `${m}m`;
}

function StatPill({ icon: Icon, label, value, iconClass }) {
  return (
    <div className="flex min-w-[7.5rem] flex-1 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
      <Icon className={`mb-1 ${iconClass || "text-white/40"}`} size={20} />
      <p className="font-mono text-xl font-bold tabular-nums text-white">
        {value}
      </p>
      <p className="text-[11px] text-white/45">{label}</p>
    </div>
  );
}

export async function generateMetadata({ params }) {
  const resolved = typeof params?.then === "function" ? await params : params;
  const username = resolved?.username;
  if (!username) return privateProfileMetadata();

  try {
    // Unauthenticated — never leak friends-only profiles into OG caches.
    const { ok, profile } = await fetchPublicProfile(username, {
      revalidate: 12 * 60 * 60,
    });
    if (!ok || !profile) return privateProfileMetadata();
    if (!profile.profile_public) return privateProfileMetadata();
    return profileShareMetadata(profile, `/${profile.username}`);
  } catch {
    return privateProfileMetadata();
  }
}

export default async function UserProfilePage({ params }) {
  const resolved = typeof params?.then === "function" ? await params : params;
  const username =
    typeof resolved?.username === "string" ? resolved.username : null;

  if (!username) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#070b14]">
        <p className="text-white/70">Profile not found</p>
        <Link href="/spaces" className="text-blue-300 hover:text-blue-200">
          Browse spaces
        </Link>
      </div>
    );
  }

  let profile = null;
  let error = null;
  try {
    // Public fetch only — cookies() would force dynamic rendering every request.
    const result = await fetchPublicProfile(username, {
      revalidate: 12 * 60 * 60,
    });
    if (!result.ok || !result.profile) {
      error = "Profile not found";
    } else {
      profile = result.profile;
    }
  } catch {
    error = "Profile not found";
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#070b14]">
        <p className="text-white/70">{error || "Profile not found"}</p>
        <Link href="/spaces" className="text-blue-300 hover:text-blue-200">
          Browse spaces
        </Link>
      </div>
    );
  }

  if (!profile.profile_public) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#070b14]">
        <p className="text-white/70">This profile is friends only.</p>
        <Link href="/spaces" className="text-blue-300 hover:text-blue-200">
          Browse spaces
        </Link>
      </div>
    );
  }

  const streak = profile.streak;
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;

  return (
    <SpacesPageShell
      backHref="/spaces"
      backLabel="Spaces"
      title={profile.name || profile.username}
      subtitle={
        <>
          <span className="text-white/60">@{profile.username}</span>
        </>
      }
      action={
        profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/10"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-2 ring-white/10">
            <User size={28} className="text-white/40" />
          </span>
        )
      }
    >
      {(streak || profile.all_time_focus_minutes != null) && (
        <div className="mb-8 flex flex-wrap gap-3">
          {streak && (
            <>
              <StatPill
                icon={Flame}
                label="day streak"
                value={current}
                iconClass="text-orange-400 fill-orange-400"
              />
              <StatPill
                icon={Trophy}
                label="longest streak"
                value={longest}
                iconClass="text-amber-300 fill-amber-300"
              />
            </>
          )}
          {profile.all_time_focus_minutes != null && (
            <StatPill
              icon={Clock}
              label="all-time focus"
              value={formatFocusMinutes(profile.all_time_focus_minutes)}
              iconClass="text-blue-300"
            />
          )}
        </div>
      )}

      {profile.focus_activity ? (
        <div className="mb-10">
          <FocusActivityGraph activity={profile.focus_activity} />
        </div>
      ) : null}

      <div className="mb-5 flex items-end justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-300/70">
          Spaces
        </h2>
        <p className="text-xs text-white/35">
          {(profile.spaces || []).length} public
        </p>
      </div>

      {(!profile.spaces || profile.spaces.length === 0) && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-12 text-center text-sm text-white/50">
          No spaces to show.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(profile.spaces || []).map((space) => (
          <SpaceCard key={space.id} space={space} showCreator={false} />
        ))}
      </div>
    </SpacesPageShell>
  );
}
