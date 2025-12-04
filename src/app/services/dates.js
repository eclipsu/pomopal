export function getWeeksDates() {
  const date = new Date();

  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());

  const lastWeek = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + i);
    lastWeek.push(day.toISOString().split("T")[0]);
  }

  return lastWeek;
}

export function isOlderThan24Hours(inputDate) {
  const given = new Date(inputDate).getTime();
  const now = Date.now();

  const diff = now - given;
  return diff > 24 * 60 * 60 * 1000;
}
