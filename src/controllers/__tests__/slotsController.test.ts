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

describe("SlotsController", () => {
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
      query: {},
      headers: {},
    };

    slotsController = new SlotsController();
    mockCalComService = MockedCalComService.mock
      .instances[0] as jest.Mocked<CalComService>;
  });

  describe("getAvailableSlots", () => {
    beforeEach(() => {
      // Mock validation result to return no errors by default
      mockedValidationResult.mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      } as any);
    });

    it("should return available slots successfully", async () => {
      mockRequest.query = {
        eventTypeId: "123",
        startDate: "2023-12-01T00:00:00Z",
        endDate: "2023-12-07T23:59:59Z",
        timezone: "America/New_York",
      };

      const mockCalComResponse = {
        slots: [
          { time: "2023-12-01T10:00:00Z", attendees: 0 },
          { time: "2023-12-01T11:00:00Z", bookingUid: "existing" },
        ],
      };

      mockCalComService.getAvailableSlots.mockResolvedValue(mockCalComResponse);

      await slotsController.getAvailableSlots(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        slots: [
          {
            start: "2023-12-01T10:00:00Z",
            end: "2023-12-01T10:30:00Z",
            available: true,
          },
          {
            start: "2023-12-01T11:00:00Z",
            end: "2023-12-01T11:30:00Z",
            available: false,
          },
        ],
        eventTypeId: "123",
        dateRange: {
          start: "2023-12-01T00:00:00Z",
          end: "2023-12-07T23:59:59Z",
        },
      });
    });

    it("should handle validation errors", async () => {
      const validationErrors = [
        { msg: "Event type ID is required", param: "eventTypeId" },
      ];

      mockedValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => validationErrors,
      } as any);

      await slotsController.getAvailableSlots(
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

    it("should handle Cal.com service errors", async () => {
      mockRequest.query = { eventTypeId: "123" };

      const serviceError = new Error("Cal.com API error");
      mockCalComService.getAvailableSlots.mockRejectedValue(serviceError);

      await slotsController.getAvailableSlots(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve available slots",
          details: "Cal.com API error",
          timestamp: expect.any(String),
        },
      });
    });

    it("should use correlation ID from headers", async () => {
      const correlationId = "test-correlation-id";
      mockRequest.headers = { "x-correlation-id": correlationId };
      mockRequest.query = { eventTypeId: "123" };

      const mockCalComResponse = { slots: [] };
      mockCalComService.getAvailableSlots.mockResolvedValue(mockCalComResponse);

      await slotsController.getAvailableSlots(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCalComService.getAvailableSlots).toHaveBeenCalledWith(
        expect.any(Object),
        correlationId
      );
    });

    it("should generate correlation ID when not provided", async () => {
      mockRequest.query = { eventTypeId: "123" };

      const mockCalComResponse = { slots: [] };
      mockCalComService.getAvailableSlots.mockResolvedValue(mockCalComResponse);

      await slotsController.getAvailableSlots(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCalComService.getAvailableSlots).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringMatching(/^slots-\d+$/)
      );
    });

    it("should handle empty slots response", async () => {
      mockRequest.query = { eventTypeId: "123" };

      const mockCalComResponse = { slots: [] };
      mockCalComService.getAvailableSlots.mockResolvedValue(mockCalComResponse);

      await slotsController.getAvailableSlots(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        slots: [],
        eventTypeId: "123",
        dateRange: {
          start: expect.any(String),
          end: expect.any(String),
        },
      });
    });
  });

  describe("calculateEndTime", () => {
    it("should calculate end time correctly", () => {
      const controller = new SlotsController();
      const startTime = "2023-12-01T10:00:00Z";
      const duration = 30;

      // Access private method for testing
      const endTime = (controller as any).calculateEndTime(startTime, duration);

      expect(endTime).toBe("2023-12-01T10:30:00Z");
    });
  });

  describe("placeholder methods", () => {
    it("should return not implemented for reserveSlot", async () => {
      await slotsController.reserveSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(501);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "NOT_IMPLEMENTED",
          message: "Reserve slot functionality not implemented yet",
          timestamp: expect.any(String),
        },
      });
    });

    it("should return not implemented for updateSlot", async () => {
      await slotsController.updateSlot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(501);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "NOT_IMPLEMENTED",
          message: "Update slot functionality not implemented yet",
          timestamp: expect.any(String),
        },
      });
    });
  });
});
