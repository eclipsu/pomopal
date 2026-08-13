"use client";

import { useState } from "react";
import {
  Check,
  Facebook,
  Linkedin,
  Link2,
  Mail,
  Share2,
} from "lucide-react";

function XIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 6.045L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function openShare(url) {
  window.open(url, "_blank", "noopener,noreferrer,width=600,height=640");
}

export default function ShareArticle({ url, title, description = "" }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(
    description ? `${title} — ${description}` : title,
  );

  const actions = [
    {
      id: "linkedin",
      label: "Share on LinkedIn",
      Icon: Linkedin,
      onClick: () =>
        openShare(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        ),
    },
    {
      id: "facebook",
      label: "Share on Facebook",
      Icon: Facebook,
      onClick: () =>
        openShare(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        ),
    },
    {
      id: "x",
      label: "Share on X",
      Icon: XIcon,
      onClick: () =>
        openShare(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
        ),
    },
    {
      id: "whatsapp",
      label: "Share on WhatsApp",
      Icon: WhatsAppIcon,
      onClick: () =>
        openShare(`https://wa.me/?text=${encodedText}%20${encodedUrl}`),
    },
    {
      id: "email",
      label: "Share by email",
      Icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
    },
    {
      id: "copy",
      label: copied ? "Link copied" : "Copy link",
      Icon: copied ? Check : Link2,
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // ignore
        }
      },
    },
  ];

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
        <Share2 className="h-3.5 w-3.5" aria-hidden />
        Share article
      </h2>
      <ul className="flex flex-wrap gap-2.5">
        {actions.map(({ id, label, Icon, href, onClick }) => {
          const className =
            "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 shadow-[0_1px_0_rgba(255,255,255,0.04)] transition hover:-translate-y-0.5 hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900";

          if (href) {
            return (
              <li key={id}>
                <a href={href} className={className} aria-label={label} title={label}>
                  <Icon className="h-5 w-5" />
                </a>
              </li>
            );
          }

          return (
            <li key={id}>
              <button
                type="button"
                onClick={onClick}
                className={className}
                aria-label={label}
                title={label}
              >
                <Icon className="h-5 w-5" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
