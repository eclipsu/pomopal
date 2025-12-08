import { databases } from "@/app/lib/appwrite";

const DATABASE_ID = "pomodoro_sessions_db";
const SESSIONS_COLLECTION_ID = "sessions";

export async function createSession(userId, selected, duration) {
  if (!userId) {
    console.warn("No userId provided. Aborting.");
    return null;
  }

  const sessionTypeMap = {
    0: "pomodoro",
    1: "short_break",
    2: "long_break",
  };

  const sessionType = sessionTypeMap[selected];

  try {
    const session = await databases.createDocument(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      "unique()",
      {
        userId,
        sessionType,
        duration,
        startTime: new Date().toISOString(),
        completed: false,
      }
    );

    return {
      sessionId: session.$id,
      startTime: new Date().toISOString(),
      duration,
      selected,
      sessionType,
    };
  } catch (error) {
    console.error("Error creating session:", error);
    return null;
  }
}

export async function updateSession(sessionId, actualDuration, completed) {
  if (!sessionId) {
    console.warn("No sessionId provided. Aborting.");
    return null;
  }

  try {
    const result = await databases.updateDocument(DATABASE_ID, SESSIONS_COLLECTION_ID, sessionId, {
      endTime: new Date().toISOString(),
      actualDuration,
      completed,
    });

    return result;
  } catch (error) {
    console.error("Error updating session:", error);
    return null;
  }
}

export async function markSessionAbandoned(sessionId, elapsedSeconds) {
  return updateSession(sessionId, elapsedSeconds, false);
}

export const SessionService = {
  createSession,
  updateSession,
  markSessionAbandoned,
};
