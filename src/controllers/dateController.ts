import { Request, Response } from "express";
import { DateService } from "../services/dateService";
import { DateResponse, ErrorResponse } from "../types/api";
import { logger } from "../utils/logger";

export class DateController {
  private dateService: DateService;

  constructor() {
    this.dateService = new DateService();
  }

  /**
   * GET /api/date
   * Returns the current date and timestamp
   * Query parameters:
   * - timezone: Optional IANA timezone identifier (e.g., 'America/New_York')
   */
  getCurrentDate = async (req: Request, res: Response): Promise<void> => {
    const correlationId =
      (req.headers["x-correlation-id"] as string) || `date-${Date.now()}`;

    try {
      const timezone = req.query.timezone as string;

      logger.info(
        "Processing get current date request",
        { timezone },
        correlationId
      );

      const dateResponse: DateResponse =
        this.dateService.getCurrentDateResponse(timezone);

      logger.info(
        "Successfully processed get current date request",
        {
          currentDate: dateResponse.currentDate,
          timestamp: dateResponse.timestamp,
          timezone: dateResponse.timezone,
          utcDate: dateResponse.utcDate,
        },
        correlationId
      );

      res.status(200).json(dateResponse);
    } catch (error) {
      logger.error(
        "Error processing get current date request",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        correlationId
      );

      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve current date",
          details:
            error instanceof Error ? error.message : "Unknown error occurred",
          timestamp: new Date().toISOString(),
        },
      };

      res.status(500).json(errorResponse);
    }
  };
}
