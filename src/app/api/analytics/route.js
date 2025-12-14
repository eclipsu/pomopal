import { getStreak, getStudyHours, incrementStreak } from "@/app/services/analytics";
import { databases, Query, ID } from "@/app/lib/appwrite"; // server client
import { isOlderThan24Hours } from "@/app/services/dates";

export async function GET(req) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });

  const date = req.headers.get("x-date");
  const streak = await getStreak(userId);
  console.log("Received date in route header:");
  console.log("Route file's date typeof :", date, typeof date);
  const studyHours = await getStudyHours(userId, date);

  return new Response(JSON.stringify({ streak, studyHours }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// POST endpoint (increment streak)
export async function POST(req) {
  const { userId } = await req.json();
  if (!userId) return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });

  const newStreak = await incrementStreak(userId);

  return new Response(JSON.stringify({ streak: newStreak }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
