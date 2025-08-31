import axios from "axios";
import { CalComService } from "../calcomService";

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

describe("CalComService - Available Slots", () => {
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

  describe("getAvailableSlots", () => {
    const mockParams = {
      eventTypeId: "123",
      startDate: "2023-12-01T00:00:00Z",
      endDate: "2023-12-07T23:59:59Z",
      timezone: "America/New_York",
    };

    const mockCalComResponse = {
      data: {
        slots: [
          { time: "2023-12-01T10:00:00Z", attendees: 0 },
          { time: "2023-12-01T11:00:00Z", attendees: 0 },
          { time: "2023-12-01T14:00:00Z", bookingUid: "existing-booking" },
        ],
      },
    };

    it("should fetch available slots successfully", async () => {
      mockAxiosInstance.get.mockResolvedValue(mockCalComResponse);

      const result = await calcomService.getAvailableSlots(mockParams);

      expect(result).toEqual(mockCalComResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/slots/available?eventTypeId=123&startTime=2023-12-01T00%3A00%3A00Z&endTime=2023-12-07T23%3A59%3A59Z&timeZone=America%2FNew_York",
        { headers: {} }
      );
    });

    it("should handle minimal parameters", async () => {
      const minimalParams = { eventTypeId: "123" };
      mockAxiosInstance.get.mockResolvedValue(mockCalComResponse);

      const result = await calcomService.getAvailableSlots(minimalParams);

      expect(result).toEqual(mockCalComResponse.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/slots/available?eventTypeId=123",
        { headers: {} }
      );
    });

    it("should include correlation ID in headers when provided", async () => {
      const correlationId = "test-correlation-id";
      mockAxiosInstance.get.mockResolvedValue(mockCalComResponse);

      await calcomService.getAvailableSlots(mockParams, correlationId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(expect.any(String), {
        headers: { "x-correlation-id": correlationId },
      });
    });

    it("should handle API errors properly", async () => {
      const apiError = new Error("Cal.com API error");
      mockAxiosInstance.get.mockRejectedValue(apiError);

      await expect(calcomService.getAvailableSlots(mockParams)).rejects.toThrow(
        "Cal.com API error"
      );
    });

    it("should construct query parameters correctly", async () => {
      mockAxiosInstance.get.mockResolvedValue(mockCalComResponse);

      await calcomService.getAvailableSlots({
        eventTypeId: "456",
        startDate: "2023-12-15T09:00:00Z",
        timezone: "Europe/London",
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/slots/available?eventTypeId=456&startTime=2023-12-15T09%3A00%3A00Z&timeZone=Europe%2FLondon",
        { headers: {} }
      );
    });

    it("should handle empty slots response", async () => {
      const emptyResponse = { data: { slots: [] } };
      mockAxiosInstance.get.mockResolvedValue(emptyResponse);

      const result = await calcomService.getAvailableSlots(mockParams);

      expect(result).toEqual(emptyResponse.data);
      expect(result.slots).toHaveLength(0);
    });
  });
});
