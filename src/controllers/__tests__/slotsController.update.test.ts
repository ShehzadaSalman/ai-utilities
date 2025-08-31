import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { SlotsController } from "../slotsController";
import { CalComService } from "../../services/calcomService";
import { CalComReservationResponse } from "../../types/calcom";
import { logger } from "../../utils/logger";

// Mock dependencies
jest.mock("../../services/calcomService");
jest.mock("../../utils/logger");
jest.mock("express-validator");

// Mock config
jest.mock("../../config", () => ({
  config: {
    calcom: {
      baseUrl: "https://api.cal.com/v1",
      apiKey: "test-api-key",
    },
    logging: {
      level: "info",
    },
  },
}));

const MockedCalComService = CalComService as jest.MockedClass<
  typeof CalComService
>;
const mockedLogger = logger as jest.Mocked<typeof logger>;
const mockedValidationResult = validationResult as jest.MockedFunction<
  typeof validationResult
>;

describe("SlotsController - updateSlot", () => {
  let slotsController: SlotsController;
  let mockCalComService: jest.Mocked<CalComService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCalComService = {
      updateReservation: jest.fn(),
    } as any;

    MockedCalComService.mockImplementation(() => mockCalComService);

    slotsController = new SlotsController();

    mockRequest = {
      params: { reservationId: "test-reservation-123" },
      body: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock validation result to return no errors by default
    mockedValidationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    } as any);
  });

  describe("successful update", () => {
    it("should update slot successfully with all fields", async () => {
      const updateRequest = {
        start: "2024-01-15T10:00:00Z",
        end: "2024-01-15T11:00:00Z",
        attendee: {
          name: "Updated Name",
          email: "updated@example.com",
        },
        metadata: {
          location: "Updated Location",
          notes: "Updated notes",
        },
      };

      mockRequest.body = updateRequest;
      mockRequest.headers = { "x-correlation-id": "test-correlation-id" };

      const mockCalComResponse: CalComReservationResponse = {
        uid: "test-reservation-123",
        id: 123,
        title: "Updated Meeting",
        startTime: "2024-01-15T10:00:00Z",
        endTime: "2024-01-15T11:00:00Z",
        status: "confirmed",
        attendees: [
          {
            id: 1,
            name: "Updated Name",
            email: "updated@example.com",
            timeZone: "UTC",
          },
        ],
        organizer: {
          id: 1,
          name: "Organizer",
          email: "organizer@example.com",
          timeZone: "UTC",
        },
      };

      mockCalComService.updateReservation.mockResolvedValue(mockCalComResponse);

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCalComService.updateReservation).toHaveBeenCalledWith(
        "test-reservation-123",
        {
          start: "2024-01-15T10:00:00Z",
          end: "2024-01-15T11:00:00Z",
          responses: {
            name: "Updated Name",
            email: "updated@example.com",
            location: "Updated Location",
            notes: "Updated notes",
          },
          metadata: {
            location: "Updated Location",
            notes: "Updated notes",
          },
        },
        "test-correlation-id"
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        reservationId: "test-reservation-123",
        status: "confirmed",
        eventDetails: {
          start: "2024-01-15T10:00:00Z",
          end: "2024-01-15T11:00:00Z",
          eventTypeId: "123",
        },
        attendee: {
          name: "Updated Name",
          email: "updated@example.com",
        },
      });

      expect(mockedLogger.info).toHaveBeenCalledWith(
        "Processing update slot request",
        {
          reservationId: "test-reservation-123",
          start: "2024-01-15T10:00:00Z",
          end: "2024-01-15T11:00:00Z",
          attendeeEmail: "updated@example.com",
          attendeeName: "Updated Name",
        },
        "test-correlation-id"
      );
    });

    it("should update slot with partial data", async () => {
      const updateRequest = {
        attendee: {
          name: "New Name Only",
        },
      };

      mockRequest.body = updateRequest;

      const mockCalComResponse: CalComReservationResponse = {
        uid: "test-reservation-123",
        id: 123,
        title: "Meeting",
        startTime: "2024-01-15T09:00:00Z",
        endTime: "2024-01-15T10:00:00Z",
        status: "confirmed",
        attendees: [
          {
            id: 1,
            name: "New Name Only",
            email: "original@example.com",
            timeZone: "UTC",
          },
        ],
        organizer: {
          id: 1,
          name: "Organizer",
          email: "organizer@example.com",
          timeZone: "UTC",
        },
      };

      mockCalComService.updateReservation.mockResolvedValue(mockCalComResponse);

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCalComService.updateReservation).toHaveBeenCalledWith(
        "test-reservation-123",
        {
          responses: {
            name: "New Name Only",
          },
        },
        expect.any(String)
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should generate correlation ID when not provided", async () => {
      const updateRequest = {
        attendee: { name: "Test" },
      };

      mockRequest.body = updateRequest;
      mockRequest.headers = {};

      const mockCalComResponse: CalComReservationResponse = {
        uid: "test-reservation-123",
        id: 123,
        title: "Meeting",
        startTime: "2024-01-15T09:00:00Z",
        endTime: "2024-01-15T10:00:00Z",
        status: "confirmed",
        attendees: [
          {
            id: 1,
            name: "Test",
            email: "test@example.com",
            timeZone: "UTC",
          },
        ],
        organizer: {
          id: 1,
          name: "Organizer",
          email: "organizer@example.com",
          timeZone: "UTC",
        },
      };

      mockCalComService.updateReservation.mockResolvedValue(mockCalComResponse);

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCalComService.updateReservation).toHaveBeenCalledWith(
        "test-reservation-123",
        expect.any(Object),
        expect.stringMatching(/^update-\d+$/)
      );
    });
  });

  describe("validation errors", () => {
    it("should return 400 for validation errors", async () => {
      const validationErrors = [
        {
          msg: "Reservation ID is required",
          param: "reservationId",
          location: "params",
        },
      ];

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => validationErrors,
      } as any);

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: validationErrors,
          timestamp: expect.any(String),
        },
      });

      expect(mockCalComService.updateReservation).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle 404 not found error", async () => {
      mockRequest.body = { attendee: { name: "Test" } };

      const error = new Error("Cal.com API resource not found.");
      mockCalComService.updateReservation.mockRejectedValue(error);

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "RESERVATION_NOT_FOUND",
          message: "Reservation not found",
          details: "Cal.com API resource not found.",
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle 401 authentication error", async () => {
      mockRequest.body = { attendee: { name: "Test" } };

      const error = new Error(
        "Cal.com API authentication failed. Please check your API key."
      );
      mockCalComService.updateReservation.mockRejectedValue(error);

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "Authentication failed",
          details:
            "Cal.com API authentication failed. Please check your API key.",
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle 409 conflict error", async () => {
      mockRequest.body = { start: "2024-01-15T10:00:00Z" };

      const error = new Error(
        "Cal.com API conflict. Resource may already exist or be unavailable."
      );
      mockCalComService.updateReservation.mockRejectedValue(error);

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "UPDATE_CONFLICT",
          message: "Update conflict - slot may no longer be available",
          details:
            "Cal.com API conflict. Resource may already exist or be unavailable.",
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle generic server error", async () => {
      mockRequest.body = { attendee: { name: "Test" } };

      const error = new Error("Something went wrong");
      mockCalComService.updateReservation.mockRejectedValue(error);

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update slot",
          details: "Something went wrong",
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle non-Error objects", async () => {
      mockRequest.body = { attendee: { name: "Test" } };

      mockCalComService.updateReservation.mockRejectedValue("String error");

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update slot",
          details: "Unknown error occurred",
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe("logging", () => {
    it("should log request processing and success", async () => {
      const updateRequest = {
        start: "2024-01-15T10:00:00Z",
        attendee: {
          name: "Test User",
          email: "test@example.com",
        },
      };

      mockRequest.body = updateRequest;
      mockRequest.headers = { "x-correlation-id": "test-correlation-id" };

      const mockCalComResponse: CalComReservationResponse = {
        uid: "test-reservation-123",
        id: 123,
        title: "Meeting",
        startTime: "2024-01-15T10:00:00Z",
        endTime: "2024-01-15T11:00:00Z",
        status: "confirmed",
        attendees: [
          {
            id: 1,
            name: "Test User",
            email: "test@example.com",
            timeZone: "UTC",
          },
        ],
        organizer: {
          id: 1,
          name: "Organizer",
          email: "organizer@example.com",
          timeZone: "UTC",
        },
      };

      mockCalComService.updateReservation.mockResolvedValue(mockCalComResponse);

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockedLogger.info).toHaveBeenCalledWith(
        "Processing update slot request",
        {
          reservationId: "test-reservation-123",
          start: "2024-01-15T10:00:00Z",
          end: undefined,
          attendeeEmail: "test@example.com",
          attendeeName: "Test User",
        },
        "test-correlation-id"
      );

      expect(mockedLogger.info).toHaveBeenCalledWith(
        "Successfully processed update slot request",
        {
          reservationId: "test-reservation-123",
          status: "confirmed",
          start: "2024-01-15T10:00:00Z",
        },
        "test-correlation-id"
      );
    });

    it("should log errors", async () => {
      mockRequest.body = { attendee: { name: "Test" } };

      const error = new Error("Test error");
      error.stack = "Error stack trace";
      mockCalComService.updateReservation.mockRejectedValue(error);

      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockedLogger.error).toHaveBeenCalledWith(
        "Error processing update slot request",
        {
          reservationId: "test-reservation-123",
          error: "Test error",
          stack: "Error stack trace",
        },
        expect.any(String)
      );
    });
  });
});
