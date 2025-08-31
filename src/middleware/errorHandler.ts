import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { ErrorResponse } from "../types/api";
import {
  CalComApiError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from "../utils/errors";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId =
    (req.headers["x-correlation-id"] as string) || `error-${Date.now()}`;

  logger.error(
    "Unhandled error in request",
    {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    },
    correlationId
  );

  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred";
  let details: any = undefined;

  // Handle specific error types
  if (error instanceof CalComApiError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ValidationError) {
    statusCode = 400;
    errorCode = error.code;
    message = error.message;
    details = { field: error.field };
  } else if (error instanceof AuthenticationError) {
    statusCode = 401;
    errorCode = error.code;
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorCode = error.code;
    message = error.message;
    details = { resource: error.resource };
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    errorCode = error.code;
    message = error.message;
    details = { resource: error.resource };
  } else if (error instanceof RateLimitError) {
    statusCode = 429;
    errorCode = error.code;
    message = error.message;
    if (error.retryAfter) {
      res.set("Retry-After", error.retryAfter.toString());
      details = { retryAfter: error.retryAfter };
    }
  }

  const errorResponse: ErrorResponse = {
    error: {
      code: errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(statusCode).json(errorResponse);
};
