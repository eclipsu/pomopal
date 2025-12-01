import { databases, Query, ID } from "@/app/lib/appwrite";

const DATABASE_ID = "pomodoro_sessions_db";
const COLLECTION_ID = "analytics";

function isOlderThan24Hours(inputDate) {
  const given = new Date(inputDate).getTime();
  const now = Date.now();

  const diff = now - given;
  return diff > 24 * 60 * 60 * 1000;
}
export async function getStreak(userId) {
  const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal("userId", userId),
  ]);

  if (result.total === 0) {
    console.log("Analytics not found - creating new one");
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
      console.log(
        `Last active date was ${new Date(doc.lastActiveDate)}. Skipping streak increment.`
      );
      return doc.streak;
    }

    const newStreak = (doc.streak || 0) + 1;

    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
      streak: newStreak,
      lastActiveDate: new Date().toISOString(),
    });

    console.log("Streak updated:", newStreak);
    return newStreak;
  } catch (e) {
    console.error("Streak update failed:", e);
  }
}
