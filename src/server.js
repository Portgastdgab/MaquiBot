const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const { startFollowupScheduler } = require("./modules/followup/followup.service");

let stopFollowupScheduler = null;

const server = app.listen(env.port, () => {
  logger.info(`MaquiBot backend listening on port ${env.port}`);

  if (env.followup.enabled) {
    stopFollowupScheduler = startFollowupScheduler({
      intervalMs: env.followup.intervalMs,
      initialDelayMs: env.followup.initialDelayMs,
      minWaitMinutes: env.followup.minWaitMinutes,
      maxWaitMinutes: env.followup.maxWaitMinutes
    });
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    logger.error(`Port ${env.port} is already in use. Stop the existing process or change PORT in .env.`);
    process.exit(1);
  }

  logger.error("Server failed to start", {
    message: error.message
  });
  process.exit(1);
});

function shutdown(signal) {
  logger.info("Shutdown signal received", { signal });

  if (typeof stopFollowupScheduler === "function") {
    stopFollowupScheduler();
  }

  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
