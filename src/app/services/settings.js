import { databases, Permission, Role } from "@/app/lib/appwrite";
import { Query } from "appwrite";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const SETTINGS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_SETTINGS_COLLECTION_ID;

export async function createDefaultSettings(userId) {
  await databases.createDocument(
    DATABASE_ID,
    SETTINGS_COLLECTION_ID,
    "unique()",
    {
      user_id: userId,
      pomodoro_duration: 25,
      break_duration: 5,
      long_break_duration: 15,
      alarm_enabled: true,
    },
    [Permission.read(Role.user(userId)), Permission.write(Role.user(userId))]
  );
}

export async function ensureSettings(userId) {
  const res = await databases.listDocuments(DATABASE_ID, SETTINGS_COLLECTION_ID, [
    Query.equal("user_id", userId),
  ]);
  if (res.total === 0) await createDefaultSettings(userId);
}
