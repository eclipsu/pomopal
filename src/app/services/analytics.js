import { databases, Query, ID } from "@/app/lib/appwrite";

const DATABASE_ID = "pomodoro_sessions_db";
const COLLECTION_ID = "analytics";
export async function getStreak(userId) {
  const result = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal("userId", userId),
  ]);

  if (result.total === 0) {
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      userId: userId,
      streak: 0,
      hours_focused: 0,
      lastActiveDate: null,
    });

    return 0;
  }
  return result.documents[0].streak;
}
