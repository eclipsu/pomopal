import { databases, Query, ID } from "@/app/lib/appwrite";
import { isOlderThan24Hours, getWeeksDates } from "@/app/services/dates";

const DATABASE_ID = "pomodoro_sessions_db";
const COLLECTION_ID = "analytics";

export async function getStreak(userId) {
  const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal("userId", userId),
  ]);

  if (result.total === 0) {
    // console.log("Analytics not found - creating new one");
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, userId, {
      userId,
      streak: 0,
      hours_focused: 0,
      lastActiveDate: null,
    });

    return 0;
  }

  // Exactly one doc
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
  const SESSIONS_COLLECTION_ID = "sessions";
  const HOURS_COLLECTION_ID = "study_hours";
  const weekDates = getWeeksDates();

  const result = await databases.listDocuments(DATABASE_ID, HOURS_COLLECTION_ID, [
    Query.equal("userId", userId),
    Query.equal("startDate", weekDates[0]),
  ]);

  if (result.total <= 0) {
    const sessions = await databases.listDocuments(DATABASE_ID, SESSIONS_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.createdAfter("2025-01-01T00:00:00Z"),
    ]);
    const totalMilliseconds = sessions.documents.reduce((acc, session) => {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime).getTime();
      return acc + (end - start);
    }, 0);

    const totalHours = totalMilliseconds / (1000 * 60 * 60);
  }

  // console.log(sessions.documents);
  // return sessions.documents;
}
