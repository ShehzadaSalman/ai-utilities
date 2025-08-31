import axios from "axios";
import { CalComService } from "../calcomService";
import {
  CalComUpdateData,
  CalComReservationResponse,
} from "../../types/calcom";
import { logger } from "../../utils/logger";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock("../../utils/logger");
const mockedLogger = logger as jest.Mocked<typeof logger>;

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

describe("CalComService - updateReservation", () => {
  let calcomService: CalComService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios.create to return a mock instance
    mockAxiosInstance = {
      patch: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    calcomService = new CalComService();
  });

  describe("successful update", () => {
    it("should update reservation successfully", async () => {
      const reservationId = "test-reservation-123";
      const updateData: CalComUpdateData = {
        start: "2024-01-15T10:00:00Z",
        end: "2024-01-15T11:00:00Z",
        responses: {
          name: "Updated Name",
          email: "updated@example.com",
          notes: "Updated notes",
        },
      };

      const mockResponse: CalComReservationResponse = {
        uid: reservationId,
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

      mockAxiosInstance.patch.mockResolvedValue({ data: mockResponse });

      const result = await calcomService.updateReservation(
        reservationId,
        updateData,
        "test-correlation-id"
      );

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `/bookings/${reservationId}`,
        updateData,
        {
          headers: { "x-correlation-id": "test-correlation-id" },
        }
      );

      expect(result).toEqual(mockResponse);

      expect(mockedLogger.info).toHaveBeenCalledWith(
        "Updating reservation in Cal.com",
        {
          reservationId,
          start: updateData.start,
          attendeeEmail: updateData.responses?.email,
          attendeeName: updateData.responses?.name,
        },
        "test-correlation-id"
      );

      expect(mockedLogger.info).toHaveBeenCalledWith(
        "Successfully updated reservation",
        {
          reservationId,
          status: mockResponse.status,
          start: mockResponse.startTime,
        },
        "test-correlation-id"
      );
    });

    it("should update reservation without correlation ID", async () => {
      const reservationId = "test-reservation-123";
      const updateData: CalComUpdateData = {
        responses: {
          name: "Updated Name",
        },
      };

      const mockResponse: CalComReservationResponse = {
        uid: reservationId,
        id: 123,
        title: "Updated Meeting",
        startTime: "2024-01-15T10:00:00Z",
        endTime: "2024-01-15T11:00:00Z",
        status: "confirmed",
        attendees: [
          {
            id: 1,
            name: "Updated Name",
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

      mockAxiosInstance.patch.mockResolvedValue({ data: mockResponse });

      const result = await calcomService.updateReservation(
        reservationId,
        updateData
      );

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `/bookings/${reservationId}`,
        updateData,
        {
          headers: {},
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe("error handling", () => {
    it("should handle 404 not found error", async () => {
      const reservationId = "non-existent-reservation";
      const updateData: CalComUpdateData = {
        responses: { name: "Test" },
      };

      const error = {
        response: {
          status: 404,
          statusText: "Not Found",
          data: { message: "Reservation not found" },
        },
        config: { url: `/bookings/${reservationId}` },
      };

      // Mock the interceptor to call the error handler
      const errorHandler = jest
        .fn()
        .mockRejectedValue(new Error("Cal.com API resource not found."));
      mockAxiosInstance.patch.mockImplementation(() => errorHandler());

      await expect(
        calcomService.updateReservation(reservationId, updateData)
      ).rejects.toThrow("Cal.com API resource not found.");

      expect(mockedLogger.error).toHaveBeenCalledWith(
        "Failed to update reservation",
        {
          reservationId,
          error: "Cal.com API resource not found.",
        },
        undefined
      );
    });

    it("should handle 401 authentication error", async () => {
      const reservationId = "test-reservation-123";
      const updateData: CalComUpdateData = {
        responses: { name: "Test" },
      };

      const errorHandler = jest
        .fn()
        .mockRejectedValue(
          new Error(
            "Cal.com API authentication failed. Please check your API key."
          )
        );
      mockAxiosInstance.patch.mockImplementation(() => errorHandler());

      await expect(
        calcomService.updateReservation(reservationId, updateData)
      ).rejects.toThrow(
        "Cal.com API authentication failed. Please check your API key."
      );
    });

    it("should handle 409 conflict error", async () => {
      const reservationId = "test-reservation-123";
      const updateData: CalComUpdateData = {
        start: "2024-01-15T10:00:00Z",
      };

      const errorHandler = jest
        .fn()
        .mockRejectedValue(
          new Error(
            "Cal.com API conflict. Resource may already exist or be unavailable."
          )
        );
      mockAxiosInstance.patch.mockImplementation(() => errorHandler());

      await expect(
        calcomService.updateReservation(reservationId, updateData)
      ).rejects.toThrow(
        "Cal.com API conflict. Resource may already exist or be unavailable."
      );
    });

    it("should handle network error", async () => {
      const reservationId = "test-reservation-123";
      const updateData: CalComUpdateData = {
        responses: { name: "Test" },
      };

      const errorHandler = jest
        .fn()
        .mockRejectedValue(
          new Error("Cal.com API network error. Please check your connection.")
        );
      mockAxiosInstance.patch.mockImplementation(() => errorHandler());

      await expect(
        calcomService.updateReservation(reservationId, updateData)
      ).rejects.toThrow(
        "Cal.com API network error. Please check your connection."
      );

      expect(mockedLogger.error).toHaveBeenCalledWith(
        "Failed to update reservation",
        {
          reservationId,
          error: "Cal.com API network error. Please check your connection.",
        },
        undefined
      );
    });

    it("should handle generic error", async () => {
      const reservationId = "test-reservation-123";
      const updateData: CalComUpdateData = {
        responses: { name: "Test" },
      };

      const errorHandler = jest
        .fn()
        .mockRejectedValue(new Error("Cal.com API request failed to setup."));
      mockAxiosInstance.patch.mockImplementation(() => errorHandler());

      await expect(
        calcomService.updateReservation(reservationId, updateData)
      ).rejects.toThrow("Cal.com API request failed to setup.");
    });
  });

  describe("logging", () => {
    it("should log update request and response", async () => {
      const reservationId = "test-reservation-123";
      const updateData: CalComUpdateData = {
        start: "2024-01-15T10:00:00Z",
        responses: {
          name: "Test User",
          email: "test@example.com",
        },
      };

      const mockResponse: CalComReservationResponse = {
        uid: reservationId,
        id: 123,
        title: "Test Meeting",
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

      mockAxiosInstance.patch.mockResolvedValue({ data: mockResponse });

      await calcomService.updateReservation(
        reservationId,
        updateData,
        "test-correlation-id"
      );

      expect(mockedLogger.info).toHaveBeenCalledWith(
        "Updating reservation in Cal.com",
        {
          reservationId,
          start: updateData.start,
          attendeeEmail: updateData.responses?.email,
          attendeeName: updateData.responses?.name,
        },
        "test-correlation-id"
      );

      expect(mockedLogger.info).toHaveBeenCalledWith(
        "Successfully updated reservation",
        {
          reservationId,
          status: mockResponse.status,
          start: mockResponse.startTime,
        },
        "test-correlation-id"
      );
    });
  });
});
