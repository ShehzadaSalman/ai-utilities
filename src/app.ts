import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { dateRoutes } from "./routes/dateRoutes";
import { slotsRoutes } from "./routes/slotsRoutes";
import { logger } from "./utils/logger";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Cal.com API test endpoint
app.get("/api/test-calcom", async (req, res) => {
  try {
    const { CalComService } = await import("./services/calcomService");
    const calcomService = new CalComService();
    const isValid = await calcomService.validateConnection();

    res.status(200).json({
      status: isValid ? "connected" : "failed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use("/api/date", dateRoutes);
app.use("/api/slots", slotsRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
      timestamp: new Date().toISOString(),
    },
  });
});

// Error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Unhandled error", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      },
    });
  }
);

export default app;
