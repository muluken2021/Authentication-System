import "dotenv/config";
import { validateConfig } from "./config/index.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";
import app from "./app.js";
import config from "./config/index.js";

// Fail fast if required env vars are missing
validateConfig();

const PORT = config.port;

async function startServer() {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`[Server] BizFinance API running on port ${PORT} (${config.env})`);
  });

  // ─── Graceful shutdown ───────────────────────────────────────────────────
  const shutdown = async (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log("[Server] HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // ─── Unhandled rejection safety net ─────────────────────────────────────
  process.on("unhandledRejection", (reason) => {
    console.error("[Server] Unhandled rejection:", reason);
    shutdown("unhandledRejection");
  });
}

startServer();
