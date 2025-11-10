import { databases, ID, Permission, Role, account, storage } from "@/app/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const META_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_USERS_META_ID;
const END_POINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT;

// To initialize with default values
export async function createDefaultMeta(userId) {
  return await databases.createDocument(
    DATABASE_ID,
    META_COLLECTION_ID,
    ID.unique(),
    {
      user_id: userId,
      total_pomodoros: 0,
      total_minutes: 0,
      current_streak: 0,
    },
    [Permission.read(Role.user(userId)), Permission.write(Role.user(userId))]
  );
}

export async function updateUserStats(userId, data) {
  const docs = await databases.listDocuments(DATABASE_ID, META_COLLECTION_ID, [
    Query.equal("user_id", userId),
  ]);
  //   if user exists
  if (docs.total > 0) {
    return await databases.updateDocument(
      DATABASE_ID,
      META_COLLECTION_ID,
      docs.documents[0].$id,
      data
    );
  }
}

export async function updateAvatar(userId, avatarFile) {
  try {
    try {
      await storage.deleteFile(BUCKET_ID, userId);
    } catch {}

    const uploaded = await storage.createFile(BUCKET_ID, userId, avatarFile);
    const previewUrl = storage.getFileView(BUCKET_ID, uploaded.$id);

    return previewUrl;
  } catch (error) {
    console.error("❌ updateAvatar error:", error.message);
    return null;
  }
}
