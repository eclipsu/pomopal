import { databases, DATABASE_ID, SESSIONS_COLLECTION } from "../app/appwrite.js";
import { ID, Query } from "appwrite";

DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "";
SESSIONS_COLLECTION = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION || "";
export async function createSession(userId, sessionType) {
  return await databases.createDocument(DATABASE_ID, SESSIONS_COLLECTION, ID.unique(), {
    userId,
    sessionType,
    duration: 25,
    startTime: new Date().toISOString(),
    completed: false,
  });
}

export async function completeSession(sessionId, actualDuration) {
  return await databases.updateDocument(DATABASE_ID, SESSIONS_COLLECTION, sessionId, {
    endTime: new Date().toISOString(),
    actualDuration,
    completed: true,
  });
}

export async function getRecentSessions(userId) {
  return await databases.listDocuments(DATABASE_ID, SESSIONS_COLLECTION, [
    Query.equal("userId", userId),
    Query.orderDesc("startTime"),
    Query.limit(10),
  ]);
}
