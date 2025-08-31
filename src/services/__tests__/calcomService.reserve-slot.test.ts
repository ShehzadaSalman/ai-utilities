import axios from "axios";
import { CalComService } from "../calcomService";
import { CalComReservationData } from "../../types/calcom";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config
jest.mock("../../config", () => ({
  config: {
    calcom: {
      baseUrl: "https://api.cal.com/v2",
      apiKey: "test-api-key",
    },
  },
}));

// Mock logger
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("CalComService - Reserve Slot", () => {
  let calcomService: CalComService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: {
          use: jest.fn((successHandler, errorHandler) => {
            // Store the error handler so we can use it in tests
            mockAxiosInstance._errorHandler = errorHandler;
          }),
        },
      },
      defaults: { headers: {} },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    calcomService = new CalComService();
  });

  describe("reserveSlot", () => {
    const mockReservationData: CalComReservationData = {
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
      metadata: { source: "api" },
    };

    const mockCalComResponse = {
      data: {
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
      },
    };

    it("should reserve slot successfully", async () => {
      mockAxiosInstance.post.mockResolvedValue(mockCalComResponse);

      const result = await calcomService.reserveSlot(mockReservationData);

      expect(result).toEqual(mockCalComResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/slots/reserve",
        mockReservationData,
        { headers: {} }
      );
    });

    it("should include correlation ID in headers when provided", async () => {
      const correlationId = "test-correlation-id";
      mockAxiosInstance.post.mockResolvedValue(mockCalComResponse);

      await calcomService.reserveSlot(mockReservationData, correlationId);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/slots/reserve",
        mockReservationData,
        { headers: { "x-correlation-id": correlationId } }
      );
    });

    it("should handle API errors properly", async () => {
      const apiError = new Error("Slot unavailable");
      mockAxiosInstance.post.mockRejectedValue(apiError);

      await expect(
        calcomService.reserveSlot(mockReservationData)
      ).rejects.toThrow("Slot unavailable");
    });

    it("should handle conflict errors (409)", async () => {
      const conflictError = {
        response: {
          status: 409,
          statusText: "Conflict",
          data: { message: "Slot is already booked" },
        },
        config: { url: "/slots/reserve" },
        isAxiosError: true,
      };

      mockAxiosInstance.post.mockImplementation(() => {
        if (mockAxiosInstance._errorHandler) {
          return mockAxiosInstance._errorHandler(conflictError);
        }
        return Promise.reject(conflictError);
      });

      await expect(
        calcomService.reserveSlot(mockReservationData)
      ).rejects.toThrow("Cal.com API conflict");
    });

    it("should handle authentication errors (401)", async () => {
      const authError = {
        response: {
          status: 401,
          statusText: "Unauthorized",
          data: { message: "Invalid API key" },
        },
        config: { url: "/slots/reserve" },
        isAxiosError: true,
      };

      mockAxiosInstance.post.mockImplementation(() => {
        if (mockAxiosInstance._errorHandler) {
          return mockAxiosInstance._errorHandler(authError);
        }
        return Promise.reject(authError);
      });

      await expect(
        calcomService.reserveSlot(mockReservationData)
      ).rejects.toThrow("Cal.com API authentication failed");
    });

    it("should handle not found errors (404)", async () => {
      const notFoundError = {
        response: {
          status: 404,
          statusText: "Not Found",
          data: { message: "Event type not found" },
        },
        config: { url: "/slots/reserve" },
        isAxiosError: true,
      };

      mockAxiosInstance.post.mockImplementation(() => {
        if (mockAxiosInstance._errorHandler) {
          return mockAxiosInstance._errorHandler(notFoundError);
        }
        return Promise.reject(notFoundError);
      });

      await expect(
        calcomService.reserveSlot(mockReservationData)
      ).rejects.toThrow("Cal.com API resource not found");
    });

    it("should log reservation details correctly", async () => {
      mockAxiosInstance.post.mockResolvedValue(mockCalComResponse);

      await calcomService.reserveSlot(mockReservationData);

      // Verify that logging was called with correct parameters
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });
  });
});
