export function toJsonString(data) {
  try {
    return JSON.stringify(data);
  } catch (err) {
    console.error("JSON stringify error:", err);
    return null;
  }
}

export function toJsonObject(str) {
  try {
    return JSON.parse(str);
  } catch (err) {
    console.error("JSON parse error:", err);
    return null;
  }
}
