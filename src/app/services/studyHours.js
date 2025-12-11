import { databases, Query, ID } from "@/app/lib/appwrite";
import { getWeeksDates } from "@/app/services/dates";
import { jsonToString, stringToJson, createObject } from "@/app/services/jsonString";

const DATABASE_ID = "pomodoro_sessions_db";
const STUDY_HOURS_COLLECTION = "study_hours";

export async function ensureWeeklyDoc(userId) {
  const weekDates = getWeeksDates();
  const startDate = weekDates[0];

  const result = await databases.listDocuments(DATABASE_ID, STUDY_HOURS_COLLECTION, [
    Query.equal("userId", userId),
    Query.equal("startDate", startDate),
  ]);

  if (result.total > 0) return result.documents[0];

  const minutesObj = createObject(weekDates);

  return await databases.createDocument(DATABASE_ID, STUDY_HOURS_COLLECTION, ID.unique(), {
    userId,
    startDate,
    minutes: jsonToString(minutesObj),
    totalMinutes: 0,
  });
}

export async function applySessionToStudyHours(userId, duration, startTime) {
  const weekDates = getWeeksDates();
  const startDate = weekDates[0];
  const sessionDate = startTime.split("T")[0];

  let result = await databases.listDocuments(DATABASE_ID, STUDY_HOURS_COLLECTION, [
    Query.equal("userId", userId),
    Query.equal("startDate", startDate),
  ]);

  let doc = result.total > 0 ? result.documents[0] : await ensureWeeklyDoc(userId);

  let minutesObj = stringToJson(doc.minutes);
  console.log(doc);

  if (minutesObj.hasOwnProperty(sessionDate)) {
    minutesObj[sessionDate] += duration;
  }
  console.log(doc);

  const newTotal = (doc.totalMinutes || 0) + duration;

  await databases.updateDocument(DATABASE_ID, STUDY_HOURS_COLLECTION, doc.$id, {
    minutes: jsonToString(minutesObj),
    totalMinutes: newTotal,
  });
  console.log(doc);
}
