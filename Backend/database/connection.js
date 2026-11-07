import mongoose from "mongoose";
import config from "../config/index.js";

/**
 * Establish a MongoDB connection.
 * Exits the process on failure so the server never starts in a broken state.
 */
export async function connectDatabase() {
  try {
    const conn = await mongoose.connect(config.db.uri);
    console.log(`[Database] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] Connection failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Gracefully close the MongoDB connection.
 * Called during server shutdown.
 */
export async function disconnectDatabase() {
  try {
    await mongoose.connection.close();
    console.log("[Database] Connection closed.");
  } catch (error) {
    console.error(`[Database] Error during disconnect: ${error.message}`);
  }
}

export default connectDatabase;
