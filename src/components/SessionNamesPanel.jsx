"use client";

import { memo } from "react";

function SessionNamesPanel({ sessions = [] }) {
  const visible = sessions.filter(
    (s) => s?.session_name && s.session_name !== "Untitled Session",
  );
  if (!visible.length) return null;

  return (
    <aside
      className="pointer-events-none absolute inset-y-0 right-0 z-[2] hidden w-48 flex-col justify-center pr-4 opacity-40 transition-opacity duration-300 hover:opacity-90 lg:flex"
      aria-label="Today's sessions"
    >
      <div className="pointer-events-auto max-h-[50vh] overflow-y-auto px-1 py-2">
        <ul className="flex flex-col gap-1">
          {visible.map((session) => (
            <li
              key={session.id}
              className="truncate px-1 py-0.5 text-right text-[11px] text-white/70"
              title={session.session_name}
            >
              {session.session_name}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default memo(SessionNamesPanel);
