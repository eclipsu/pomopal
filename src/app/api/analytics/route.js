// src/app/api/analytics/route.js
import { getStreak, getStudyHours, incrementStreak } from "@/app/services/analytics";
import { databases, Query, ID } from "@/app/lib/appwrite"; // server client
import { isOlderThan24Hours } from "@/app/services/dates";

export async function GET(req) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });

  const streak = await getStreak(userId);
  const studyHours = await getStudyHours(userId);

  return new Response(JSON.stringify({ streak, studyHours }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// POST endpoint (increment streak)
export async function POST(req) {
  const { userId } = await req.json();
  if (!userId) return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });

  const doc = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal("userId", userId),
  ]);

  let newStreak = 1;

  if (doc.total > 0) {
    const existing = doc.documents[0];
    if (!isOlderThan24Hours(existing.lastActiveDate)) newStreak = existing.streak;
    else newStreak = existing.streak + 1;

    await databases.updateDocument(DATABASE_ID, COLLECTION_ID, existing.$id, {
      streak: newStreak,
      lastActiveDate: new Date().toISOString(),
    });
  } else {
    await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      userId,
      streak: 1,
      lastActiveDate: new Date().toISOString(),
    });
  }

  return new Response(JSON.stringify({ streak: newStreak }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
