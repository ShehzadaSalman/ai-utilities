import app from "./app";
import { config, validateConfig } from "./config";
import { logger } from "./utils/logger";

async function startServer() {
  try {
    // Validate configuration
    validateConfig();
    logger.info("Configuration validated successfully");

    // Start the server
    const server = app.listen(config.port, () => {
      logger.info(`Server started successfully`, {
        port: config.port,
        nodeEnv: config.nodeEnv,
        calcomBaseUrl: config.calcom.baseUrl,
      });

      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📅 Calendar API Integration ready!`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
      console.log(`📆 Date endpoint: http://localhost:${config.port}/api/date`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

startServer();
