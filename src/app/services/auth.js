// Not using this at the moment

import { account, ID } from "@/app/lib/appwrite";
import { createDefaultMeta } from "./users";
import { createDefaultSettings } from "./settings";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

export async function registerUser(email, password, name) {
  const user = await account.create(ID.unique(), email, password, name);

  // creating the initial meta and settings for users with default values.
  await createDefaultMeta(user.$id);
  await createDefaultSettings(user.$id);

  return user;
}

export async function loginUser(email, password) {
  return await account.createEmailPasswordSession(email, password);
}

export async function logoutUser() {
  await account.deleteSession("current");
}

export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}
