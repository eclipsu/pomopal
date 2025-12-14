export function jsonToString(data) {
  try {
    return JSON.stringify(data);
  } catch (err) {
    console.error("JSON stringify error:", err);
    return null;
  }
}

export function stringToJson(str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    console.error("JSON parse error:", err);
    return null;
  }
}

export function createObject(keys) {
  return Object.fromEntries(
    keys.map((date) => [
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}`,
      0,
    ])
  );
}
