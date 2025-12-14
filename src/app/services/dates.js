export function getWeeksDates(input) {
  let base;

  if (!input) {
    base = new Date();
  } else if (typeof input === "string") {
    // Parse YYYY-MM-DD as LOCAL date (not UTC)
    const y = Number(input.slice(0, 4));
    const m = Number(input.slice(5, 7)) - 1;
    const d = Number(input.slice(8, 10));
    base = new Date(y, m, d);
  } else {
    base = new Date(input);
  }

  if (isNaN(base.getTime())) {
    throw new Error("Invalid date passed to getWeekDays");
  }

  // Force local midnight
  base.setHours(0, 0, 0, 0);

  // Find Sunday
  const sunday = new Date(base);
  sunday.setDate(base.getDate() - base.getDay());

  const week = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday); // clone
    day.setDate(sunday.getDate() + i);
    week.push(day); // ✅ Date object
  }

  return week;
}

export function isOlderThan24Hours(inputDate) {
  const given = new Date(inputDate).getTime();
  const now = Date.now();

  const diff = now - given;
  return diff > 24 * 60 * 60 * 1000;
}
