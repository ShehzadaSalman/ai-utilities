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
        response: { use: jest.fn() },
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
          data: { message: "Slot is already booked" },
        },
      };
      mockAxiosInstance.post.mockRejectedValue(conflictError);

      await expect(
        calcomService.reserveSlot(mockReservationData)
      ).rejects.toThrow();
    });

    it("should handle authentication errors (401)", async () => {
      const authError = {
        response: {
          status: 401,
          data: { message: "Invalid API key" },
        },
      };
      mockAxiosInstance.post.mockRejectedValue(authError);

      await expect(
        calcomService.reserveSlot(mockReservationData)
      ).rejects.toThrow();
    });

    it("should handle not found errors (404)", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { message: "Event type not found" },
        },
      };
      mockAxiosInstance.post.mockRejectedValue(notFoundError);

      await expect(
        calcomService.reserveSlot(mockReservationData)
      ).rejects.toThrow();
    });

    it("should log reservation details correctly", async () => {
      mockAxiosInstance.post.mockResolvedValue(mockCalComResponse);

      await calcomService.reserveSlot(mockReservationData);

      // Verify that logging was called with correct parameters
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });
  });
});
