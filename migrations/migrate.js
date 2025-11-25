import { Client, Databases, ID } from "node-appwrite";
import dotenv from "dotenv";

dotenv.config();

const CONFIG = {
  endpoint: process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1",
  projectId: process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: "pomodoro_sessions_db", // New database for sessions
};

if (!CONFIG.projectId || !CONFIG.apiKey) {
  console.error("Error: Missing APPWRITE_PROJECT_ID or APPWRITE_API_KEY in .env file");
  console.log("\nPlease create a .env file with:");
  console.log("APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1");
  console.log("APPWRITE_PROJECT_ID=your_project_id");
  console.log("APPWRITE_API_KEY=your_api_key");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(CONFIG.endpoint)
  .setProject(CONFIG.projectId)
  .setKey(CONFIG.apiKey);

const databases = new Databases(client);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createDatabase() {
  try {
    console.log("Creating new database...");
    await databases.create(CONFIG.databaseId, "Pomodoro Sessions");
    console.log("Database created successfully\n");
    await wait(1000);
  } catch (error) {
    if (error.code === 409) {
      console.log("Database already exists, skipping...\n");
    } else {
      console.error("Failed to create database:", error.message);
      throw error;
    }
  }
}

async function createSessionsCollection() {
  const collectionId = "sessions";

  try {
    console.log("Creating Sessions collection...");
    await databases.createCollection(
      CONFIG.databaseId,
      collectionId,
      "Sessions",
      [],
      true // documentSecurity
    );
    console.log("Collection created\n");

    console.log("Creating attributes...");

    await databases.createStringAttribute(CONFIG.databaseId, collectionId, "userId", 255, true);
    console.log("  userId");

    await databases.createEnumAttribute(
      CONFIG.databaseId,
      collectionId,
      "sessionType",
      ["pomodoro", "short_break", "long_break"],
      true
    );
    console.log("  sessionType");

    await databases.createIntegerAttribute(
      CONFIG.databaseId,
      collectionId,
      "duration",
      true,
      1,
      120
    );
    console.log("  duration");

    await databases.createIntegerAttribute(
      CONFIG.databaseId,
      collectionId,
      "actualDuration",
      false,
      0,
      120
    );
    console.log("  actualDuration");

    await databases.createDatetimeAttribute(CONFIG.databaseId, collectionId, "startTime", true);
    console.log("  startTime");

    await databases.createDatetimeAttribute(CONFIG.databaseId, collectionId, "endTime", false);
    console.log("  endTime");

    await databases.createBooleanAttribute(
      CONFIG.databaseId,
      collectionId,
      "completed",
      false, // not required
      false // default value
    );
    console.log("  completed");

    await databases.createStringAttribute(
      CONFIG.databaseId,
      collectionId,
      "tags",
      50,
      false,
      undefined,
      true // array
    );
    console.log("  tags");

    await databases.createStringAttribute(CONFIG.databaseId, collectionId, "notes", 5000, false);
    console.log("  notes\n");

    // Wait for attributes to be available
    console.log("Waiting for attributes to be available (3 seconds)...");
    await wait(3000);

    // Create indexes
    console.log("Creating indexes...");

    await databases.createIndex(
      CONFIG.databaseId,
      collectionId,
      "userId_idx",
      "key",
      ["userId"],
      ["ASC"]
    );
    console.log("  userId_idx");

    await databases.createIndex(
      CONFIG.databaseId,
      collectionId,
      "startTime_idx",
      "key",
      ["startTime"],
      ["DESC"]
    );
    console.log("  startTime_idx");

    await databases.createIndex(
      CONFIG.databaseId,
      collectionId,
      "sessionType_idx",
      "key",
      ["sessionType"],
      ["ASC"]
    );
    console.log("  sessionType_idx");

    await databases.createIndex(
      CONFIG.databaseId,
      collectionId,
      "userId_startTime_idx",
      "key",
      ["userId", "startTime"],
      ["ASC", "DESC"]
    );
    console.log("  userId_startTime_idx (compound)\n");

    console.log("Sessions collection setup complete!\n");
  } catch (error) {
    if (error.code === 409) {
      console.log("Sessions collection already exists, skipping...\n");
    } else {
      console.error("Failed to create Sessions collection:", error.message);
      throw error;
    }
  }
}

async function createDailyLogsCollection() {
  const collectionId = "daily_logs";

  try {
    console.log("Creating Daily Logs collection...");
    await databases.createCollection(CONFIG.databaseId, collectionId, "Daily Logs", [], true);
    console.log("Collection created\n");

    // Create attributes
    console.log("Creating attributes...");

    await databases.createStringAttribute(CONFIG.databaseId, collectionId, "userId", 255, true);
    console.log("  userId");

    await databases.createStringAttribute(CONFIG.databaseId, collectionId, "date", 10, true);
    console.log("  date");

    await databases.createIntegerAttribute(
      CONFIG.databaseId,
      collectionId,
      "pomodorosCompleted",
      false,
      0,
      1000,
      0
    );
    console.log("  pomodorosCompleted");

    await databases.createIntegerAttribute(
      CONFIG.databaseId,
      collectionId,
      "shortBreaksCompleted",
      false,
      0,
      1000,
      0
    );
    console.log("  shortBreaksCompleted");

    await databases.createIntegerAttribute(
      CONFIG.databaseId,
      collectionId,
      "longBreaksCompleted",
      false,
      0,
      1000,
      0
    );
    console.log("  longBreaksCompleted");

    await databases.createIntegerAttribute(
      CONFIG.databaseId,
      collectionId,
      "totalFocusTime",
      false,
      0,
      10000,
      0
    );
    console.log("  totalFocusTime");

    await databases.createIntegerAttribute(
      CONFIG.databaseId,
      collectionId,
      "sessionsAbandoned",
      false,
      0,
      1000,
      0
    );
    console.log("  sessionsAbandoned\n");

    console.log("Waiting for attributes to be available (3 seconds)...");
    await wait(3000);

    console.log("Creating indexes...");

    await databases.createIndex(
      CONFIG.databaseId,
      collectionId,
      "userId_date_idx",
      "unique",
      ["userId", "date"],
      ["ASC", "ASC"]
    );
    console.log("  userId_date_idx (unique compound)");

    await databases.createIndex(
      CONFIG.databaseId,
      collectionId,
      "date_idx",
      "key",
      ["date"],
      ["DESC"]
    );
    console.log("  date_idx");

    await databases.createIndex(
      CONFIG.databaseId,
      collectionId,
      "userId_idx",
      "key",
      ["userId"],
      ["ASC"]
    );
    console.log("  userId_idx\n");

    console.log("Daily Logs collection setup complete!\n");
  } catch (error) {
    if (error.code === 409) {
      console.log("Daily Logs collection already exists, skipping...\n");
    } else {
      console.error("Failed to create Daily Logs collection:", error.message);
      throw error;
    }
  }
}

async function runMigrations() {
  console.log("Starting Pomodoro Database Migration\n");
  console.log("Configuration:");
  console.log(`  Endpoint: ${CONFIG.endpoint}`);
  console.log(`  Project: ${CONFIG.projectId}`);
  console.log(`  Database: ${CONFIG.databaseId}\n`);
  console.log("═══════════════════════════════════════════════════\n");

  try {
    await createDatabase();
    await createSessionsCollection();
    await createDailyLogsCollection();
  } catch (error) {
    console.log("\n═══════════════════════════════════════════════════\n");
    console.error("Migration failed:", error.message);
    if (error.response) {
      console.error("Response:", error.response);
    }
    process.exit(1);
  }
}

runMigrations();
