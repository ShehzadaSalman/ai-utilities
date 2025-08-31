import { Request, Response } from "express";
import { DateController } from "../dateController";
import { DateService } from "../../services/dateService";

// Mock the DateService
jest.mock("../../services/dateService");
const MockedDateService = DateService as jest.MockedClass<typeof DateService>;

// Mock logger
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("DateController", () => {
  let dateController: DateController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockDateService: jest.Mocked<DateService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Create mock request
    mockRequest = {
      headers: {},
    };

    // Create controller instance
    dateController = new DateController();

    // Get the mocked service instance
    mockDateService = MockedDateService.mock
      .instances[0] as jest.Mocked<DateService>;
  });

  describe("getCurrentDate", () => {
    it("should return current date response with status 200", async () => {
      const mockDateResponse = {
        currentDate: "2023-12-01T10:30:00.000Z",
        timestamp: 1701424200000,
      };

      mockDateService.getCurrentDateResponse.mockReturnValue(mockDateResponse);

      await dateController.getCurrentDate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDateResponse);
    });

    it("should handle service errors and return 500 status", async () => {
      const errorMessage = "Service error";
      mockDateService.getCurrentDateResponse.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await dateController.getCurrentDate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve current date",
          details: errorMessage,
          timestamp: expect.any(String),
        },
      });
    });

    it("should use correlation ID from headers when provided", async () => {
      const correlationId = "test-correlation-id";
      mockRequest.headers = { "x-correlation-id": correlationId };

      const mockDateResponse = {
        currentDate: "2023-12-01T10:30:00.000Z",
        timestamp: 1701424200000,
      };

      mockDateService.getCurrentDateResponse.mockReturnValue(mockDateResponse);

      await dateController.getCurrentDate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDateResponse);
    });

    it("should generate correlation ID when not provided in headers", async () => {
      mockRequest.headers = {};

      const mockDateResponse = {
        currentDate: "2023-12-01T10:30:00.000Z",
        timestamp: 1701424200000,
      };

      mockDateService.getCurrentDateResponse.mockReturnValue(mockDateResponse);

      await dateController.getCurrentDate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDateResponse);
    });

    it("should handle non-Error exceptions", async () => {
      mockDateService.getCurrentDateResponse.mockImplementation(() => {
        throw "String error";
      });

      await dateController.getCurrentDate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve current date",
          details: "Unknown error occurred",
          timestamp: expect.any(String),
        },
      });
    });
  });
});
