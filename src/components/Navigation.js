"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChartNoAxesCombined,
  LayoutGrid,
  Maximize2,
  Menu,
  Minimize2,
  Newspaper,
  Paintbrush,
  Settings,
  Shield,
  Trophy,
  Users,
  X,
} from "lucide-react";
import SignOut from "./SignOut";
import PomopalIcon from "./PomopalIcon";
import { useUser } from "@/hooks/useUser";
import StreakIndicator from "@/components/StreakIndicator";
import NotificationBell from "@/components/NotificationBell";

function NavIconButton({
  label,
  active = false,
  onClick,
  children,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:h-9 md:w-9 ${
        active
          ? "bg-white/15 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function MobileMenuItem({ label, active = false, onClick, href, icon: Icon }) {
  const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
    active
      ? "bg-white/10 text-white"
      : "text-white/80 hover:bg-white/10 hover:text-white"
  }`;

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
      {label}
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
  pageFullscreen = false,
  onTogglePageFullscreen,
}) {
  const { user, loading: authLoading, sessionLikely } = useUser();
  const [openSignOut, setOpenSignOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const showLoggedInShell = Boolean(user) || authLoading || sessionLikely;

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    // Defer so the tap that opened the menu doesn't instantly close it.
    const timerId = window.setTimeout(() => {
      document.addEventListener("click", onClick, true);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener("click", onClick, true);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const avatarButton = (
    <button
      type="button"
      onClick={() => setOpenSignOut((v) => !v)}
      className="shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-white/25 focus-visible:outline-none focus-visible:ring-white/40"
      aria-label="Account menu"
    >
      {user?.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          width={32}
          height={32}
          className="h-9 w-9 rounded-full object-cover md:h-8 md:w-8"
          src={user.avatar}
          alt=""
        />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white md:h-8 md:w-8 md:text-xs">
          {user?.name ? user.name[0].toUpperCase() : "U"}
        </span>
      )}
    </button>
  );

  return (
    <nav
      ref={navRef}
      className="relative z-30 mx-auto flex w-11/12 max-w-full min-w-0 flex-nowrap items-center gap-2 overflow-visible pt-4 text-white sm:gap-3 sm:pt-5"
    >
      <Link
        href="/"
        className="flex min-w-0 shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
      >
        <PomopalIcon size={30} className="size-[30px] shrink-0 md:size-[26px]" />
        <span className="truncate text-[15px] font-semibold tracking-tight">
          Pomopal
        </span>
      </Link>

      {user ? (
        <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2">
          <div className="hidden items-center gap-1.5 md:flex lg:gap-2">
            <Link
              href="/spaces"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              title="Spaces"
            >
              <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span>Spaces</span>
            </Link>
            <Link
              href="/blog"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              title="Blog"
            >
              <Newspaper className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span>Blog</span>
            </Link>

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

            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="inline-flex h-9 items-center rounded-lg px-2 text-xs font-medium uppercase tracking-wide text-sky-300/90 transition-colors hover:bg-white/10 hover:text-sky-200"
              >
                Admin
              </Link>
            ) : null}
          </div>

          <NavIconButton
            label={pageFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            active={pageFullscreen}
            onClick={() => onTogglePageFullscreen?.()}
            className="md:hidden"
          >
            {pageFullscreen ? (
              <Minimize2 className="h-5 w-5 md:h-[18px] md:w-[18px]" strokeWidth={1.75} />
            ) : (
              <Maximize2 className="h-5 w-5 md:h-[18px] md:w-[18px]" strokeWidth={1.75} />
            )}
          </NavIconButton>

          <NavIconButton
            label={menuOpen ? "Close menu" : "Open menu"}
            active={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="relative z-40 md:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5 md:h-[18px] md:w-[18px]" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5 md:h-[18px] md:w-[18px]" strokeWidth={1.75} />
            )}
          </NavIconButton>

          <StreakIndicator className="shrink-0" />
          <NotificationBell />
          {avatarButton}
        </div>
      ) : showLoggedInShell ? (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/spaces"
            className="hidden h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white md:inline-flex"
          >
            <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.75} />
            <span>Spaces</span>
          </Link>
          <NavIconButton
            label="Leaderboard"
            onClick={() => setShowStats((v) => !v)}
            className="hidden md:inline-flex"
          >
            <Trophy className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </NavIconButton>
          <Link
            href="/blog"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Newspaper className="h-[18px] w-[18px]" strokeWidth={1.75} />
            <span>Blog</span>
          </Link>
          <span
            className="inline-flex h-9 w-9 animate-pulse rounded-full bg-white/10"
            aria-label="Restoring session"
          />
        </div>
      ) : (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/spaces"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            title="Spaces"
          >
            <LayoutGrid className="h-[18px] w-[18px]" strokeWidth={1.75} />
            <span className="hidden sm:inline">Spaces</span>
          </Link>
          <NavIconButton
            label="Leaderboard"
            onClick={() => setShowStats((v) => !v)}
          >
            <Trophy className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </NavIconButton>
          <Link
            href="/blog"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Newspaper className="h-[18px] w-[18px]" strokeWidth={1.75} />
            <span className="hidden sm:inline">Blog</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 shrink-0 items-center rounded-lg bg-white/10 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            Login
          </Link>
        </div>
      )}

      {user && menuOpen ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-[100] md:hidden"
          role="menu"
          aria-label="Main menu"
        >
          <div className="overflow-hidden rounded-xl border border-white/10 bg-gray-900 p-2 shadow-2xl ring-1 ring-black/20">
            <MobileMenuItem
              label="Spaces"
              href="/spaces"
              icon={LayoutGrid}
              onClick={closeMenu}
            />
            <MobileMenuItem
              label="Blog"
              href="/blog"
              icon={Newspaper}
              onClick={closeMenu}
            />
            <MobileMenuItem
              label="Customize space"
              active={spaceSettingsOpen}
              icon={Paintbrush}
              onClick={() => {
                onOpenSpaceSettings();
                closeMenu();
              }}
            />
            <MobileMenuItem
              label="Friends"
              active={showFriends}
              icon={Users}
              onClick={() => {
                setShowFriends((v) => !v);
                closeMenu();
              }}
            />
            <MobileMenuItem
              label="Statistics"
              icon={ChartNoAxesCombined}
              onClick={() => {
                setShowStats((v) => !v);
                closeMenu();
              }}
            />
            <MobileMenuItem
              label="Settings"
              icon={Settings}
              onClick={() => {
                setOpenSettings((v) => !v);
                closeMenu();
              }}
            />
            {user.role === "admin" ? (
              <MobileMenuItem
                label="Admin"
                href="/admin"
                icon={Shield}
                onClick={closeMenu}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {user ? (
        <SignOut openSettings={openSignOut} setOpenSettings={setOpenSignOut} />
      ) : null}
    </nav>
  );
}

export default React.memo(Navigation);
