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

export async function getStudyHours(userId) {
  if (!userId) return new Array(7).fill(0);

  const weekDates = getWeeksDates(); // array of YYYY-MM-DD for the week
  const startDate = weekDates[0];
  const endDate = weekDates[6] + "T23:59:59Z";

  try {
    // fetch existing weekly hours doc
    const result = await databases.listDocuments(DATABASE_ID, STUDY_HOURS_COLLECTION, [
      Query.equal("userId", userId),
      Query.equal("startDate", startDate),
    ]);

    let minutes;
    if (result.total > 0) {
      minutes = stringToJson(result.documents[0].minutes);
    } else {
      // initialize empty week object
      minutes = createObject(weekDates);
    }

    // fetch new sessions that are not yet counted
    const sessions = await databases.listDocuments(DATABASE_ID, SESSIONS_COLLECTION, [
      Query.equal("userId", userId),
      Query.createdAfter(startDate),
      Query.createdBefore(endDate),
    ]);

    let updated = false;
    for (const session of sessions.documents) {
      const date = new Date(session.startTime).toISOString().split("T")[0];
      if (!minutes.hasOwnProperty(date)) continue;
      const oldMinutes = minutes[date] || 0;
      const newMinutes = oldMinutes + session.actualDuration;
      if (newMinutes !== oldMinutes) updated = true;
      minutes[date] = newMinutes;
    }

    if (result.total === 0) {
      // create document if missing
      await databases.createDocument(DATABASE_ID, STUDY_HOURS_COLLECTION, ID.unique(), {
        userId,
        startDate,
        minutes: jsonToString(minutes),
      });
    } else if (updated) {
      // update existing doc if new sessions added
      await databases.updateDocument(DATABASE_ID, STUDY_HOURS_COLLECTION, result.documents[0].$id, {
        minutes: jsonToString(minutes),
      });
    }

    return Object.values(minutes);
  } catch (err) {
    console.error("getStudyHours failed:", err);
    return new Array(7).fill(0);
  }
}
