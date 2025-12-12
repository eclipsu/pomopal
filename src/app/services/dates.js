export function getWeeksDates(input) {
  const date = input ? new Date(input) : new Date();

  if (isNaN(date)) {
    throw new Error("Invalid date passed to getWeeksDates");
  }

  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());

  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    week.push(day.toISOString().split("T")[0]);
  }

  return week;
}

export function isOlderThan24Hours(inputDate) {
  const given = new Date(inputDate).getTime();
  const now = Date.now();

  const diff = now - given;
  return diff > 24 * 60 * 60 * 1000;
}
