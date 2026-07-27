"use client";

import { memo, useCallback, useMemo, useState, type PointerEvent } from "react";

type ActivityDay = { date: string; minutes: number };

type FocusActivity = {
  from: string;
  to: string;
  days: ActivityDay[];
  total_minutes: number;
  active_days: number;
};

const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const LEVEL_BG = [
  "rgba(255,255,255,0.06)",
  "rgba(59,130,246,0.25)",
  "rgba(59,130,246,0.45)",
  "rgba(59,130,246,0.7)",
  "rgb(96,165,250)",
] as const;

function levelForMinutes(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 25) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(ymd: string, days: number) {
  const dt = parseYmd(ymd);
  dt.setDate(dt.getDate() + days);
  return dt.toLocaleDateString("en-CA");
}

function formatMinutes(minutes: number) {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

function formatDayLabel(ymd: string) {
  return parseYmd(ymd).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildGrid(activity: FocusActivity) {
  const map = new Map(
    (activity.days || []).map((d) => [d.date.slice(0, 10), d.minutes]),
  );

  let start = activity.from.slice(0, 10);
  const startDow = parseYmd(start).getDay();
  if (startDow !== 0) start = addDays(start, -startDow);

  const end = activity.to.slice(0, 10);
  const from = activity.from.slice(0, 10);

  // Flat cells: week-major, 7 rows per column — packed for cheap hover lookup
  const cells: { date: string; minutes: number; level: number }[] = [];
  const monthLabels: string[] = [];
  let lastMonth = -1;
  let cursor = start;
  let weekCount = 0;

  while (cursor <= end) {
    const midDate = addDays(cursor, 3);
    const month = parseYmd(midDate).getMonth();
    monthLabels.push(month !== lastMonth ? MONTHS[month] : "");
    lastMonth = month;

    for (let i = 0; i < 7; i++) {
      const date = addDays(cursor, i);
      if (date > end || date < from) {
        cells.push({ date, minutes: -1, level: -1 });
      } else {
        const minutes = map.get(date) ?? 0;
        cells.push({ date, minutes, level: levelForMinutes(minutes) });
      }
    }
    cursor = addDays(cursor, 7);
    weekCount += 1;
  }

  return { cells, monthLabels, weekCount };
}

function FocusActivityGraphInner({
  activity,
}: {
  activity: FocusActivity | null | undefined;
}) {
  const [hover, setHover] = useState<{
    date: string;
    minutes: number;
  } | null>(null);

  const grid = useMemo(
    () => (activity?.from && activity?.to ? buildGrid(activity) : null),
    [activity],
  );

  const onPointerOver = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const el = (e.target as HTMLElement).closest("[data-d]") as HTMLElement | null;
      if (!el?.dataset.d) return;
      setHover({
        date: el.dataset.d,
        minutes: Number(el.dataset.m || 0),
      });
    },
    [],
  );

  const onPointerLeave = useCallback(() => setHover(null), []);

  if (!activity || !grid) return null;

  const { cells, monthLabels, weekCount } = grid;
  const totalLabel = formatMinutes(activity.total_minutes || 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 sm:px-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {activity.active_days}{" "}
            <span className="font-normal text-white/50">
              day{activity.active_days === 1 ? "" : "s"} focused
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-white/40">
            {totalLabel} in the last year
          </p>
        </div>
        {hover && (
          <p className="rounded-lg bg-[#151b2b] px-2.5 py-1 text-xs text-white/80">
            <span className="font-medium text-white">
              {hover.minutes > 0 ? formatMinutes(hover.minutes) : "No focus"}
            </span>
            <span className="text-white/40">
              {" "}
              · {formatDayLabel(hover.date)}
            </span>
          </p>
        )}
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-max">
          <div
            className="mb-1.5 grid gap-[3px]"
            style={{
              gridTemplateColumns: `28px repeat(${weekCount}, 11px)`,
            }}
          >
            <span />
            {monthLabels.map((label, wi) => (
              <span
                key={wi}
                className="text-[10px] leading-none text-white/35"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            <div className="flex w-7 flex-col gap-[3px] pr-1">
              {WEEKDAYS.map((d, i) => (
                <span
                  key={i}
                  className="flex h-[11px] items-center text-[9px] leading-none text-white/35"
                >
                  {d}
                </span>
              ))}
            </div>

            <div
              className="grid gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${weekCount}, 11px)`,
                gridTemplateRows: "repeat(7, 11px)",
                gridAutoFlow: "column",
              }}
              onPointerOver={onPointerOver}
              onPointerLeave={onPointerLeave}
            >
              {cells.map((cell) =>
                cell.level < 0 ? (
                  <span key={cell.date} className="rounded-[2px]" />
                ) : (
                  <span
                    key={cell.date}
                    data-d={cell.date}
                    data-m={cell.minutes}
                    title={`${cell.minutes > 0 ? formatMinutes(cell.minutes) : "No focus"} on ${formatDayLabel(cell.date)}`}
                    className="rounded-[2px]"
                    style={{
                      backgroundColor: LEVEL_BG[cell.level as 0 | 1 | 2 | 3 | 4],
                    }}
                  />
                ),
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-white/40">
            <span>Less</span>
            {LEVEL_BG.map((bg, level) => (
              <span
                key={level}
                className="h-[11px] w-[11px] rounded-[2px]"
                style={{ backgroundColor: bg }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export const FocusActivityGraph = memo(FocusActivityGraphInner);
