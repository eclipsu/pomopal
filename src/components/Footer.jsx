import Link from "next/link";
import { FaDiscord } from "react-icons/fa";
import PomopalIcon from "./PomopalIcon";

const CONTACT_EMAIL = "contact@pomopal.lol";

export default function Footer({ className = "" }) {
  return (
    <footer
      className={`w-11/12 mx-auto pt-8 pb-10 border-t border-white/10 text-white/60 shrink-0 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <PomopalIcon size={22} className="shrink-0" />
          <p>© {new Date().getFullYear()} Pomopal</p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
          <a
            href="https://discord.gg/HNbgP2Nfs7"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <FaDiscord className="text-base" />
            Discord
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-white transition-colors break-all sm:break-normal"
          >
            {CONTACT_EMAIL}
          </a>
        </nav>
      </div>
    </footer>
  );
}

export { CONTACT_EMAIL };
