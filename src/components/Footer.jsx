import { memo } from "react";
import Link from "next/link";
import { FaDiscord } from "react-icons/fa";
import PomopalIcon from "./PomopalIcon";

const CONTACT_EMAIL = "contact@pomopal.lol";

/** `compact` is a single slim row for the timer page; the full footer elsewhere. */
function Footer({ className = "", tone = "dark", compact = false }) {
  const light = tone === "light";
  return (
    <footer
      className={`mx-auto w-11/12 shrink-0 border-t ${
        compact ? "py-3 text-xs" : "pb-4 pt-4 sm:pb-10 sm:pt-8"
      } ${
        light
          ? "border-neutral-200 text-neutral-500"
          : "border-white/10 text-white/60"
      } ${className}`}
    >
      <div
        className={
          compact
            ? "flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
            : "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        }
      >
        <div className={`flex items-center gap-2 ${compact ? "" : "text-sm"}`}>
          <PomopalIcon size={compact ? 16 : 22} className="shrink-0" />
          <p>© {new Date().getFullYear()} Pomopal</p>
        </div>
        <nav
          className={`flex flex-wrap items-center ${
            compact ? "gap-x-4 gap-y-1" : "gap-x-6 gap-y-2 text-sm"
          }`}
        >
          <Link
            href="/privacy"
            className={
              light
                ? "transition-colors hover:text-neutral-900"
                : "transition-colors hover:text-white"
            }
          >
            Privacy
          </Link>
          <Link
            href="/contact"
            className={
              light
                ? "transition-colors hover:text-neutral-900"
                : "transition-colors hover:text-white"
            }
          >
            Contact
          </Link>
          <a
            href="https://discord.gg/HNbgP2Nfs7"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 ${
              light
                ? "transition-colors hover:text-neutral-900"
                : "transition-colors hover:text-white"
            }`}
          >
            <FaDiscord className="text-base" />
            Discord
          </a>
          {compact ? null : (
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className={`break-all sm:break-normal ${
              light
                ? "transition-colors hover:text-neutral-900"
                : "transition-colors hover:text-white"
            }`}
          >
            {CONTACT_EMAIL}
          </a>
          )}
        </nav>
      </div>
    </footer>
  );
}

export default memo(Footer);
export { CONTACT_EMAIL };
