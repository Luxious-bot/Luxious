import app from "./app";
import { logger } from "./lib/logger";
import { startBot, stopBot } from "./bot";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "API server listening");
});

startBot().catch((err) => {
  logger.error({ err }, "Failed to start Telegram bot");
  process.exit(1);
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down");
  await stopBot();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
