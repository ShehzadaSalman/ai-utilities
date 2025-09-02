import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { CalComService } from "../services/calcomService";
import {
  AvailableSlotsParams,
  SlotsResponse,
  TimeSlot,
  ErrorResponse,
  ReservationRequest,
  ReservationResponse,
  UpdateRequest,
} from "../types/api";
import { CalComSlot, CalComReservationData } from "../types/calcom";
import { logger } from "../utils/logger";

export class SlotsController {
  private calcomService: CalComService;

  constructor() {
    this.calcomService = new CalComService();
  }

  /**
   * GET /api/slots/available
   * Returns available time slots for a specific event type
   */
  getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
    const correlationId =
      (req.headers["x-correlation-id"] as string) || `slots-${Date.now()}`;

    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn(
          "Validation errors in get available slots request",
          {
            errors: errors.array(),
          },
          correlationId
        );

        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        };

        res.status(400).json(errorResponse);
        return;
      }

      // Set default date range if not provided: today to 15 days from today
      const today = new Date();
      const fifteenDaysFromToday = new Date();
      fifteenDaysFromToday.setDate(today.getDate() + 15);

      const startDate = req.query.start as string;
      const endDate = req.query.end as string;

      const params: AvailableSlotsParams = {
        eventTypeId: req.query.eventTypeId as string,
        start: startDate || today.toISOString(),
        end: endDate || fifteenDaysFromToday.toISOString(),
        timezone: req.query.timezone as string,
      };

      logger.info(
        "Processing get available slots request",
        {
          eventTypeId: params.eventTypeId,
          start: params.start,
          end: params.end,
          timezone: params.timezone,
        },
        correlationId
      );

      // Fetch slots from Cal.com
      const calcomResponse = await this.calcomService.getAvailableSlots(
        {
          eventTypeId: params.eventTypeId,
          start: params.start,
          end: params.end,
          timezone: params.timezone,
        },
        correlationId
      );

      // Transform Cal.com response to our API format
      const slots: TimeSlot[] = [];

      // Cal.com returns slots grouped by date
      if (calcomResponse.data?.slots) {
        Object.values(calcomResponse.data.slots).forEach(
          (dateSlots: CalComSlot[]) => {
            dateSlots.forEach((slot: CalComSlot) => {
              slots.push({
                start: slot.time,
                end: this.calculateEndTime(slot.time, 15), // Cal.com uses 15-minute slots
                available: !slot.bookingUid, // Available if no booking exists
              });
            });
          }
        );
      }

      const response: SlotsResponse = {
        slots,
        eventTypeId: params.eventTypeId,
        dateRange: {
          start: params.start!, // We know this is defined because we set defaults
          end: params.end!, // We know this is defined because we set defaults
        },
      };

      logger.info(
        "Successfully processed get available slots request",
        {
          eventTypeId: params.eventTypeId,
          slotsCount: slots.length,
          availableCount: slots.filter((slot) => slot.available).length,
        },
        correlationId
      );

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        "Error processing get available slots request",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        correlationId
      );

      const errorResponse: ErrorResponse = {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve available slots",
          details:
            error instanceof Error ? error.message : "Unknown error occurred",
          timestamp: new Date().toISOString(),
        },
      };

      res.status(500).json(errorResponse);
    }
  };

  /**
   * Calculate end time based on start time and duration
   * @param startTime - ISO string start time
   * @param durationMinutes - Duration in minutes
   * @returns ISO string end time
   */
  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return end.toISOString();
  }

  /**
   * POST /api/slots/reserve
   * Reserve a time slot for an event
   */
  reserveSlot = async (req: Request, res: Response): Promise<void> => {
    const correlationId =
      (req.headers["x-correlation-id"] as string) || `reserve-${Date.now()}`;

    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn(
          "Validation errors in reserve slot request",
          {
            errors: errors.array(),
          },
          correlationId
        );

        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        };

        res.status(400).json(errorResponse);
        return;
      }

      const reservationRequest: ReservationRequest = req.body;

      logger.info(
        "Processing reserve slot request",
        {
          eventTypeId: reservationRequest.eventTypeId,
          start: reservationRequest.start,
          end: reservationRequest.end,
          attendeeEmail: reservationRequest.attendee.email,
          attendeeName: reservationRequest.attendee.name,
        },
        correlationId
      );

      // Transform request to Cal.com format (simplified for slots/reservations endpoint)
      const calcomReservationData: CalComReservationData = {
        eventTypeId: parseInt(reservationRequest.eventTypeId, 10),
        slotStart: reservationRequest.start,
      };

      // Create reservation via Cal.com
      const calcomResponse = await this.calcomService.reserveSlot(
        calcomReservationData,
        correlationId
      );

      // Transform Cal.com response to our API format
      const response: ReservationResponse = {
        reservationId: calcomResponse.data.reservationUid,
        status: this.mapCalComStatus(calcomResponse.status),
        eventDetails: {
          start: calcomResponse.data.slotStart,
          end: calcomResponse.data.slotEnd,
          eventTypeId: reservationRequest.eventTypeId,
        },
        attendee: {
          name: reservationRequest.attendee.name,
          email: reservationRequest.attendee.email,
        },
      };

      logger.info(
        "Successfully processed reserve slot request",
        {
          reservationId: response.reservationId,
          status: response.status,
          eventTypeId: reservationRequest.eventTypeId,
        },
        correlationId
      );

      res.status(201).json(response);
    } catch (error) {
      logger.error(
        "Error processing reserve slot request",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        correlationId
      );

      // Handle specific error types
      let statusCode = 500;
      let errorCode = "INTERNAL_SERVER_ERROR";
      let errorMessage = "Failed to reserve slot";

      if (error instanceof Error) {
        if (
          error.message.includes("conflict") ||
          error.message.includes("unavailable")
        ) {
          statusCode = 409;
          errorCode = "SLOT_UNAVAILABLE";
          errorMessage = "The requested slot is no longer available";
        } else if (
          error.message.includes("authentication") ||
          error.message.includes("unauthorized")
        ) {
          statusCode = 401;
          errorCode = "AUTHENTICATION_ERROR";
          errorMessage = "Authentication failed";
        } else if (error.message.includes("not found")) {
          statusCode = 404;
          errorCode = "EVENT_TYPE_NOT_FOUND";
          errorMessage = "Event type not found";
        }
      }

      const errorResponse: ErrorResponse = {
        error: {
          code: errorCode,
          message: errorMessage,
          details:
            error instanceof Error ? error.message : "Unknown error occurred",
          timestamp: new Date().toISOString(),
        },
      };

      res.status(statusCode).json(errorResponse);
    }
  };

  /**
   * PUT /api/slots/:reservationId
   * Update an existing reservation
   */
  updateSlot = async (req: Request, res: Response): Promise<void> => {
    const correlationId =
      (req.headers["x-correlation-id"] as string) || `update-${Date.now()}`;

    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn(
          "Validation errors in update slot request",
          {
            errors: errors.array(),
          },
          correlationId
        );

        const errorResponse: ErrorResponse = {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
            details: errors.array(),
            timestamp: new Date().toISOString(),
          },
        };

        res.status(400).json(errorResponse);
        return;
      }

      const reservationId = req.params.reservationId;
      const updateRequest: UpdateRequest = req.body;

      logger.info(
        "Processing update slot request",
        {
          reservationId,
          start: updateRequest.start,
          end: updateRequest.end,
          attendeeEmail: updateRequest.attendee?.email,
          attendeeName: updateRequest.attendee?.name,
        },
        correlationId
      );

      // Transform request to Cal.com format
      const calcomUpdateData: any = {};

      if (updateRequest.start) {
        calcomUpdateData.start = updateRequest.start;
      }

      if (updateRequest.end) {
        calcomUpdateData.end = updateRequest.end;
      }

      if (updateRequest.attendee) {
        calcomUpdateData.responses = {};
        if (updateRequest.attendee.name) {
          calcomUpdateData.responses.name = updateRequest.attendee.name;
        }
        if (updateRequest.attendee.email) {
          calcomUpdateData.responses.email = updateRequest.attendee.email;
        }
      }

      if (updateRequest.metadata) {
        calcomUpdateData.metadata = updateRequest.metadata;
        if (updateRequest.metadata.location) {
          calcomUpdateData.responses = calcomUpdateData.responses || {};
          calcomUpdateData.responses.location = updateRequest.metadata.location;
        }
        if (updateRequest.metadata.notes) {
          calcomUpdateData.responses = calcomUpdateData.responses || {};
          calcomUpdateData.responses.notes = updateRequest.metadata.notes;
        }
      }

      // Update reservation via Cal.com
      const calcomResponse = await this.calcomService.updateReservation(
        reservationId,
        calcomUpdateData,
        correlationId
      );

      // Transform Cal.com response to our API format
      // Note: Update endpoint may have different response format than reservation endpoint
      const response: ReservationResponse = {
        reservationId:
          (calcomResponse as any).uid ||
          (calcomResponse as any).data?.reservationUid ||
          reservationId,
        status: this.mapCalComStatus(
          (calcomResponse as any).status || "pending"
        ),
        eventDetails: {
          start:
            (calcomResponse as any).startTime ||
            (calcomResponse as any).data?.slotStart ||
            updateRequest.start ||
            "",
          end:
            (calcomResponse as any).endTime ||
            (calcomResponse as any).data?.slotEnd ||
            updateRequest.end ||
            "",
          eventTypeId:
            (calcomResponse as any).id?.toString() ||
            (calcomResponse as any).data?.eventTypeId?.toString() ||
            "",
        },
        attendee: {
          name:
            (calcomResponse as any).attendees?.[0]?.name ||
            updateRequest.attendee?.name ||
            "",
          email:
            (calcomResponse as any).attendees?.[0]?.email ||
            updateRequest.attendee?.email ||
            "",
        },
      };

      logger.info(
        "Successfully processed update slot request",
        {
          reservationId,
          status: response.status,
          start: response.eventDetails.start,
        },
        correlationId
      );

      res.status(200).json(response);
    } catch (error) {
      logger.error(
        "Error processing update slot request",
        {
          reservationId: req.params.reservationId,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
        correlationId
      );

      // Handle specific error types
      let statusCode = 500;
      let errorCode = "INTERNAL_SERVER_ERROR";
      let errorMessage = "Failed to update slot";

      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          statusCode = 404;
          errorCode = "RESERVATION_NOT_FOUND";
          errorMessage = "Reservation not found";
        } else if (
          error.message.includes("authentication") ||
          error.message.includes("unauthorized")
        ) {
          statusCode = 401;
          errorCode = "AUTHENTICATION_ERROR";
          errorMessage = "Authentication failed";
        } else if (
          error.message.includes("conflict") ||
          error.message.includes("unavailable")
        ) {
          statusCode = 409;
          errorCode = "UPDATE_CONFLICT";
          errorMessage = "Update conflict - slot may no longer be available";
        }
      }

      const errorResponse: ErrorResponse = {
        error: {
          code: errorCode,
          message: errorMessage,
          details:
            error instanceof Error ? error.message : "Unknown error occurred",
          timestamp: new Date().toISOString(),
        },
      };

      res.status(statusCode).json(errorResponse);
    }
  };

  /**
   * Map Cal.com status to our API status format
   */
  private mapCalComStatus(
    calcomStatus: string
  ): "confirmed" | "pending" | "cancelled" {
    switch (calcomStatus.toLowerCase()) {
      case "success":
      case "accepted":
      case "confirmed":
        return "confirmed";
      case "pending":
        return "pending";
      case "cancelled":
      case "rejected":
        return "cancelled";
      default:
        return "pending";
    }
  }
}
