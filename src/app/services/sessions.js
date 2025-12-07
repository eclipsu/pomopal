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
