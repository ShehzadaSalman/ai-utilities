import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { SlotsController } from "../slotsController";
import { CalComService } from "../../services/calcomService";

// Mock dependencies
jest.mock("../../services/calcomService");
jest.mock("express-validator");

const MockedCalComService = CalComService as jest.MockedClass<
  typeof CalComService
>;
const mockedValidationResult = validationResult as jest.MockedFunction<
  typeof validationResult
>;

// Mock logger
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("SlotsController - Reserve Slot", () => {
  let slotsController: SlotsController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockCalComService: jest.Mocked<CalComService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      body: {},
      headers: {},
    };

    slotsController = new SlotsController();
    mockCalComService = MockedCalComService.mock
      .instances[0] as jest.Mocked<CalComService>;
  });

  describe("reserveSlot", () => {
    beforeEach(() => {
      // Mock validation result to return no errors by default
      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      } as any);
    });

    const mockReservationRequest = {
      eventTypeId: "123",
      start: "2023-12-01T10:00:00Z",
      end: "2023-12-01T10:30:00Z",
      attendee: {
        name: "John Doe",
        email: "john@example.com",
        timezone: "America/New_York",
      },
      metadata: {
        location: "Online",
        notes: "Test booking",
      },
    };

    const mockCalComResponse = {
      uid: "booking-123",
      id: 456,
      title: "Meeting with John Doe",
      startTime: "2023-12-01T10:00:00Z",
      endTime: "2023-12-01T10:30:00Z",
      status: "confirmed",
      attendees: [
        {
          id: 1,
          email: "john@example.com",
          name: "John Doe",
          timeZone: "America/New_York",
        },
      ],
      organizer: {
        id: 2,
        name: "Organizer Name",
        email: "organizer@example.com",
        timeZone: "America/New_York",
      },
    };

    it("should reserve slot successfully", async () => {
      mockRequest.body = mockReservationRequest;
      mockCalComService.reserveSlot.mockResolvedValue(mockCalComResponse);

      await slotsController.reserveSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        reservationId: "booking-123",
        status: "confirmed",
        eventDetails: {
          start: "2023-12-01T10:00:00Z",
          end: "2023-12-01T10:30:00Z",
          eventTypeId: "123",
        },
        attendee: {
          name: "John Doe",
          email: "john@example.com",
        },
      });
    });

    it("should handle validation errors", async () => {
      const validationErrors = [
        { msg: "Event type ID is required", param: "eventTypeId" },
        { msg: "Start time is required", param: "start" },
      ];

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => validationErrors,
      } as any);

      await slotsController.reserveSlot(
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
    });

    it("should handle slot unavailable error (409)", async () => {
      mockRequest.body = mockReservationRequest;

      const conflictError = new Error(
        "Slot is no longer available or conflict detected"
      );
      mockCalComService.reserveSlot.mockRejectedValue(conflictError);

      await slotsController.reserveSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "SLOT_UNAVAILABLE",
          message: "The requested slot is no longer available",
          details: "Slot is no longer available or conflict detected",
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle authentication error (401)", async () => {
      mockRequest.body = mockReservationRequest;

      const authError = new Error("Cal.com API authentication failed");
      mockCalComService.reserveSlot.mockRejectedValue(authError);

      await slotsController.reserveSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "AUTHENTICATION_ERROR",
          message: "Authentication failed",
          details: "Cal.com API authentication failed",
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle not found error (404)", async () => {
      mockRequest.body = mockReservationRequest;

      const notFoundError = new Error("Event type not found");
      mockCalComService.reserveSlot.mockRejectedValue(notFoundError);

      await slotsController.reserveSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "EVENT_TYPE_NOT_FOUND",
          message: "Event type not found",
          details: "Event type not found",
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle generic server error (500)", async () => {
      mockRequest.body = mockReservationRequest;

      const genericError = new Error("Internal server error");
      mockCalComService.reserveSlot.mockRejectedValue(genericError);

      await slotsController.reserveSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reserve slot",
          details: "Internal server error",
          timestamp: expect.any(String),
        },
      });
    });

    it("should use correlation ID from headers", async () => {
      const correlationId = "test-correlation-id";
      mockRequest.headers = { "x-correlation-id": correlationId };
      mockRequest.body = mockReservationRequest;
      mockCalComService.reserveSlot.mockResolvedValue(mockCalComResponse);

      await slotsController.reserveSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCalComService.reserveSlot).toHaveBeenCalledWith(
        expect.any(Object),
        correlationId
      );
    });

    it("should generate correlation ID when not provided", async () => {
      mockRequest.body = mockReservationRequest;
      mockCalComService.reserveSlot.mockResolvedValue(mockCalComResponse);

      await slotsController.reserveSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCalComService.reserveSlot).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringMatching(/^reserve-\d+$/)
      );
    });

    it("should transform request data correctly for Cal.com API", async () => {
      mockRequest.body = mockReservationRequest;
      mockCalComService.reserveSlot.mockResolvedValue(mockCalComResponse);

      await slotsController.reserveSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCalComService.reserveSlot).toHaveBeenCalledWith(
        {
          eventTypeId: 123,
          start: "2023-12-01T10:00:00Z",
          responses: {
            name: "John Doe",
            email: "john@example.com",
            location: "Online",
            notes: "Test booking",
          },
          timeZone: "America/New_York",
          language: "en",
          metadata: {
            location: "Online",
            notes: "Test booking",
          },
        },
        expect.any(String)
      );
    });
  });

  describe("mapCalComStatus", () => {
    it("should map Cal.com statuses correctly", () => {
      const controller = new SlotsController();

      // Access private method for testing
      const mapStatus = (controller as any).mapCalComStatus;

      expect(mapStatus("accepted")).toBe("confirmed");
      expect(mapStatus("confirmed")).toBe("confirmed");
      expect(mapStatus("pending")).toBe("pending");
      expect(mapStatus("cancelled")).toBe("cancelled");
      expect(mapStatus("rejected")).toBe("cancelled");
      expect(mapStatus("unknown")).toBe("pending");
    });
  });
});
