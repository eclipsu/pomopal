import { databases, Query, ID } from "@/app/lib/appwrite";
import { isOlderThan24Hours, getWeeksDates } from "@/app/services/dates";
import { jsonToString, stringToJson, createObject } from "@/app/services/jsonString";

const DATABASE_ID = "pomodoro_sessions_db";
const COLLECTION_ID = "analytics";
export async function getStreak(userId) {
  if (!userId) return 0;
  const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal("userId", userId),
  ]);

  if (result.total === 0) {
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      userId,
      streak: 0,
      hours_focused: 0,
      lastActiveDate: null,
    });
    return 0;
  }

  return result.documents[0].streak;
}
export async function incrementStreak(userId) {
  try {
    const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal("userId", userId),
    ]);

    if (result.total === 0) {
      console.log("No analytics found - creating fresh record");

      await databases.createDocument(DATABASE_ID, COLLECTION_ID, userId, {
        userId,
        streak: 1,
        hours_focused: 0,
        lastActiveDate: new Date().toISOString(),
      });

      return 1;
    }

    const doc = result.documents[0];

    if (!isOlderThan24Hours(doc.lastActiveDate)) {
      return doc.streak;
    }

    const newStreak = (doc.streak || 0) + 1;

    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
      streak: newStreak,
      lastActiveDate: new Date().toISOString(),
    });
    return newStreak;
  } catch (e) {
    console.error("Streak update failed:", e);
  }
}
export async function getStudyHours(userId) {
  if (!userId) return new Array(7).fill(0);
  const SESSIONS_COLLECTION_ID = "sessions";
  const HOURS_COLLECTION_ID = "study_hours";
  const weekDates = getWeeksDates();

  const result = await databases.listDocuments(DATABASE_ID, HOURS_COLLECTION_ID, [
    Query.equal("userId", userId),
    Query.equal("startDate", weekDates[0]),
  ]);

  // if not in database, calculate from sessions
  // we are going to get the values back
  if (result.total <= 0) {
    const sessions = await databases.listDocuments(DATABASE_ID, SESSIONS_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.createdAfter("2025-01-01T00:00:00Z"),
    ]);

    const minutes = createObject(getWeeksDates());
    for (const session of sessions.documents) {
      const date = new Date(session.startTime).toISOString().split("T")[0];
      if (!minutes.hasOwnProperty(date)) continue;
      minutes[date] += session.actualDuration;
    }

    await databases.createDocument(DATABASE_ID, HOURS_COLLECTION_ID, ID.unique(), {
      userId,
      startDate: weekDates[0],
      minutes: jsonToString(minutes),
    });

    return Object.values(minutes);
  }

  return Object.values(stringToJson(result.documents[0].minutes));

  // return existing hours database
  // hours is stored as a JSON string with week as keys and hours as values
  // return Object.values(stringToJson(result.documents[0].hours));
}
