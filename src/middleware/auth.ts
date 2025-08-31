import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { config } from "../config";
import { ErrorResponse } from "../types/api";

/**
 * Middleware to validate Cal.com API configuration
 */
export const validateCalComAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId =
    (req.headers["x-correlation-id"] as string) || `auth-${Date.now()}`;

  try {
    if (!config.calcom.apiKey) {
      logger.error("Cal.com API key not configured", {}, correlationId);

      const errorResponse: ErrorResponse = {
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "Cal.com API key not configured",
          timestamp: new Date().toISOString(),
        },
      };

      res.status(401).json(errorResponse);
      return;
    }

    logger.debug("Cal.com authentication validated", {}, correlationId);
    next();
  } catch (error) {
    logger.error(
      "Error validating Cal.com authentication",
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      correlationId
    );

    const errorResponse: ErrorResponse = {
      error: {
        code: "AUTHENTICATION_ERROR",
        message: "Authentication validation failed",
        timestamp: new Date().toISOString(),
      },
    };

    res.status(500).json(errorResponse);
  }
};
