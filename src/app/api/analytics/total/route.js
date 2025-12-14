import { getTotalMinutes, setTotalMinutes } from "@/app/services/analytics";
export async function GET(req) {
  const userId = req.headers.get("x-user-id");
  if (!userId) throw Error("User ID not found");
  const totalMinutes = await getTotalMinutes(userId);
  return new Response(JSON.stringify({ totalMinutes }), {
    status: 200,
  });
}

// export async function PUT(req) {
//   const { userId, minute } = await req.json();
// }
