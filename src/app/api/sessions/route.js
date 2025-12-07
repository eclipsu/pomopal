// creating a session
import { createSession } from "@/app/services/sessions";

export async function POST(req) {
  const { userId, selected, duration } = await req.json();

  if (!userId || duration == null || selected == null) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  // Create session in Appwrite
  const result = await createSession(userId, selected, duration);

  if (!result) {
    return new Response(JSON.stringify({ error: "Failed to create session" }), { status: 500 });
  }

  return new Response(
    JSON.stringify({
      sessionId: result.sessionId,
      startTime: result.startTime,
      duration: result.duration,
      selected,
      sessionType: result.sessionType,
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
}
