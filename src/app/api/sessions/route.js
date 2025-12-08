// creating a session
import { createSession } from "@/app/services/sessions";
import { updateSession } from "@/app/services/sessions";

export async function POST(req) {
  const { userId, selected, duration } = await req.json();

  if (!userId || duration == null || selected == null)
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });

  // Create session in Appwrite
  const result = await createSession(userId, selected, duration);

  if (!result)
    return new Response(JSON.stringify({ error: "Failed to create session" }), { status: 500 });

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

export async function PUT(req) {
  const { sessionId, actualDuration, completed } = await req.json();

  if (!sessionId)
    return new Response(JSON.stringify({ error: "Missing sessionId" }), { status: 400 });

  const updated = await updateSession(sessionId, actualDuration, completed);

  if (!updated)
    return new Response(JSON.stringify({ error: "Failed to update session" }), { status: 500 });

  return new Response(JSON.stringify(updated), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
