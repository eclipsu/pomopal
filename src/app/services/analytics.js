import { databases, Query, ID } from "@/app/lib/appwrite";
import { isOlderThan24Hours, getWeeksDates } from "@/app/services/dates";
import { jsonToString, stringToJson, createObject } from "@/app/services/jsonString";

const DATABASE_ID = "pomodoro_sessions_db";
const ANALYTICS_COLLECTION = "analytics";
const SESSIONS_COLLECTION = "sessions";
const STUDY_HOURS_COLLECTION = "study_hours";

export async function getStreak(userId) {
  if (!userId) return 0;
  try {
    const result = await databases.listDocuments(DATABASE_ID, ANALYTICS_COLLECTION, [
      Query.equal("userId", userId),
    ]);

    if (result.total === 0) {
      await databases.createDocument(DATABASE_ID, ANALYTICS_COLLECTION, ID.unique(), {
        userId,
        streak: 0,
        hours_focused: 0,
        lastActiveDate: null,
      });
      return 0;
    }

    return result.documents[0].streak;
  } catch (err) {
    console.error("getStreak failed:", err);
    return 0;
  }
}

export async function incrementStreak(userId) {
  if (!userId) return 0;
  try {
    const result = await databases.listDocuments(DATABASE_ID, ANALYTICS_COLLECTION, [
      Query.equal("userId", userId),
    ]);

    let doc;
    if (result.total === 0) {
      doc = await databases.createDocument(DATABASE_ID, ANALYTICS_COLLECTION, ID.unique(), {
        userId,
        streak: 1,
        hours_focused: 0,
        lastActiveDate: new Date().toISOString(),
      });
      return 1;
    }

    doc = result.documents[0];
    if (!isOlderThan24Hours(doc.lastActiveDate)) return doc.streak;

    const newStreak = (doc.streak || 0) + 1;
    await databases.updateDocument(DATABASE_ID, ANALYTICS_COLLECTION, doc.$id, {
      streak: newStreak,
      lastActiveDate: new Date().toISOString(),
    });
    return newStreak;
  } catch (err) {
    console.error("incrementStreak failed:", err);
    return 0;
  }
}

export async function getStudyHours(userId, date) {
  if (!userId) return { total: 0, weekly: new Array(7).fill(0) };

  const weekDates = getWeeksDates(); // ["YYYY-MM-DD", ...]
  const startDate = weekDates[0];

  try {
    // Check if weekly doc already exists
    const result = await databases.listDocuments(DATABASE_ID, STUDY_HOURS_COLLECTION, [
      Query.equal("userId", userId),
      Query.equal("startDate", startDate),
    ]);

    // if document does NOT exist we create & return zeros
    if (result.total === 0) {
      const emptyObj = createObject(weekDates); // {"2025-12-09":0 ...}

      await databases.createDocument(DATABASE_ID, STUDY_HOURS_COLLECTION, ID.unique(), {
        userId,
        startDate,
        minutes: jsonToString(emptyObj),
        totalMinutes: 0,
      });

      return {
        total: 0,
        weekly: new Array(7).fill(0),
      };
    }

    // if Document EXISTS we parse JSON return total + weekly array
    const doc = result.documents[0];

    const minutesObj = stringToJson(doc.minutes);
    const weeklyArray = Object.values(minutesObj);

    return {
      total: doc.totalMinutes || 0,
      weekly: weeklyArray,
    };
  } catch (err) {
    console.error("getStudyHours failed:", err);
    return {
      total: 0,
      weekly: new Array(7).fill(0),
    };
  }
}
