import app from "./app";
import { logger } from "./lib/logger";
import { ensureDbExtensions } from "./lib/bootstrap";
import { startScheduledJobs, runStartupBackfills } from "./jobs";

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

ensureDbExtensions()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
      startScheduledJobs();
      void runStartupBackfills();
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to ensure database extensions");
    process.exit(1);
  });
