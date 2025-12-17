import { databases, ID } from "@/app/lib/appwrite";
import { applySessionToStudyHours } from "@/app/services/studyHours";
import { setTotalHours } from "@/app/services/analytics";

const DATABASE_ID = "pomodoro_sessions_db";
const SESSIONS_COLLECTION_ID = "sessions";

export async function createSession(userId, selected, duration) {
  if (!userId) {
    console.warn("createSession: missing userId");
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
      ID.unique(),
      {
        userId,
        sessionType,
        plannedDuration: duration, // seconds or minutes — be consistent
        startTime: new Date().toISOString(),
        completed: false,
      }
    );

    return {
      sessionId: session.$id,
      startTime: session.startTime,
      plannedDuration: duration,
      sessionType,
    };
  } catch (error) {
    console.error("Error creating session:", error);
    return null;
  }
}

export async function updateSession(sessionId, actualDuration, completed) {
  if (!sessionId) {
    console.warn("updateSession: missing sessionId");
    return null;
  }

  try {
    const session = await databases.getDocument(DATABASE_ID, SESSIONS_COLLECTION_ID, sessionId);

    const endTime = new Date().toISOString();

    const updatedSession = await databases.updateDocument(
      DATABASE_ID,
      SESSIONS_COLLECTION_ID,
      sessionId,
      {
        endTime,
        actualDuration,
        completed,
      }
    );

    if (session.sessionType === "pomodoro") {
      await applySessionToStudyHours(session.userId, actualDuration, session.startTime);
    }

    if (session.sessionType === "pomodoro" && completed) {
      await setTotalHours(session.userId, actualDuration);
    }

    return updatedSession;
  } catch (error) {
    console.error("Error updating session:", error);
    return null;
  }
}

export async function markSessionAbandoned(sessionId, elapsedDuration) {
  return updateSession(sessionId, elapsedDuration, false);
}

export const SessionService = {
  createSession,
  updateSession,
  markSessionAbandoned,
};
