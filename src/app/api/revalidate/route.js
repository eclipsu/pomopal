import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { backendBaseUrl } from "@/lib/seo";

/**
 * On-demand ISR bust for the caller's own public profile after privacy changes.
 * POST { path: "/username" } with the user's session cookie.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const path = typeof body?.path === "string" ? body.path.trim() : "";
  if (!path.startsWith("/") || path.includes("..") || path.split("/").length !== 2) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const username = path.slice(1);
  if (!username || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const jar = await cookies();
  const cookieHeader = jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  if (!cookieHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Confirm the session owns this username before busting cache.
  try {
    const res = await fetch(`${backendBaseUrl()}/user/profile`, {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const me = await res.json();
    if (
      !me?.username ||
      String(me.username).toLowerCase() !== username.toLowerCase()
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}
