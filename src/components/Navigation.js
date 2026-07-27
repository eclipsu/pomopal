"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChartNoAxesCombined,
  LayoutGrid,
  Paintbrush,
  Settings,
  Users,
} from "lucide-react";
import SignOut from "./SignOut";
import PomopalIcon from "./PomopalIcon";
import { useUser } from "@/hooks/useUser";
import StreakIndicator from "@/components/StreakIndicator";

function NavIconButton({
  label,
  active = false,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
        active
          ? "bg-white/15 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Navigation({
  setOpenSettings,
  setShowStats,
  showFriends,
  setShowFriends,
  onOpenSpaceSettings,
  spaceSettingsOpen,
}) {
  const { user } = useUser();
  const [openSignOut, setOpenSignOut] = useState(false);

  return (
    <nav className="mx-auto flex w-11/12 max-w-full min-w-0 items-center justify-between gap-3 pt-4 text-white sm:pt-5">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
      >
        <PomopalIcon size={26} className="shrink-0" />
        <span className="text-[15px] font-semibold tracking-tight">
          Pomopal
        </span>
      </Link>

      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <Link
          href="/spaces"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          title="Spaces"
        >
          <LayoutGrid className="h-[18px] w-[18px] sm:hidden" strokeWidth={1.75} />
          <span className="hidden sm:inline">Spaces</span>
        </Link>

        {user ? (
          <>
            <div className="flex items-center gap-0.5 rounded-xl bg-white/[0.06] p-0.5 ring-1 ring-white/10">
              <NavIconButton
                label="Customize space"
                active={spaceSettingsOpen}
                onClick={onOpenSpaceSettings}
              >
                <Paintbrush className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </NavIconButton>
              <NavIconButton
                label="Friends"
                active={showFriends}
                onClick={() => setShowFriends((v) => !v)}
              >
                <Users className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </NavIconButton>
              <NavIconButton
                label="Statistics"
                onClick={() => setShowStats((v) => !v)}
              >
                <ChartNoAxesCombined
                  className="h-[18px] w-[18px]"
                  strokeWidth={1.75}
                />
              </NavIconButton>
              <NavIconButton
                label="Settings"
                onClick={() => setOpenSettings((v) => !v)}
              >
                <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </NavIconButton>
            </div>

            <StreakIndicator className="ml-0.5" />

            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="hidden h-9 items-center rounded-lg px-2 text-xs font-medium uppercase tracking-wide text-sky-300/90 transition-colors hover:bg-white/10 hover:text-sky-200 md:inline-flex"
              >
                Admin
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => setOpenSignOut((v) => !v)}
              className="ml-0.5 shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-white/25 focus-visible:outline-none focus-visible:ring-white/40"
              aria-label="Account menu"
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                  src={user.avatar}
                  alt=""
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </span>
              )}
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-lg bg-white/10 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            Login
          </Link>
        )}
      </div>

      {user ? (
        <SignOut openSettings={openSignOut} setOpenSettings={setOpenSignOut} />
      ) : null}
    </nav>
  );
}

export default React.memo(Navigation);
