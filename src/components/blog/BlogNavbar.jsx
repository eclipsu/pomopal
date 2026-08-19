"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PomopalIcon from "@/components/PomopalIcon";
import { useUser } from "@/hooks/useUser";

const links = [
  { href: "/", label: "Timer" },
  { href: "/spaces", label: "Spaces" },
  { href: "/blog", label: "Blog" },
];

export default function BlogNavbar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <nav className="sticky top-0 z-30 border-b border-[#eeeeee] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-11/12 max-w-[40rem] items-center gap-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-[#333333] transition-opacity hover:opacity-80"
        >
          <PomopalIcon size={26} className="size-[26px] shrink-0" />
          <span className="text-[15px] font-semibold">Pomopal</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active =
              href === "/blog"
                ? pathname === "/blog" || pathname?.startsWith("/blog/")
                : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "text-[#1BA0D6]"
                    : "text-[#555555] hover:text-[#333333]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {user ? (
          <Link
            href="/"
            className="ml-auto flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#f4f4f4] text-xs font-semibold text-[#333333]"
            aria-label="Open timer"
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 object-cover"
              />
            ) : (
              (user.name?.[0] || "U").toUpperCase()
            )}
          </Link>
        ) : (
          <Link
            href="/login"
            className="ml-auto text-sm font-bold text-[#1BA0D6] hover:underline"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
