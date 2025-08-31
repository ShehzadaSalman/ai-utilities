import axios, { AxiosError } from "axios";
import { CalComService } from "../calcomService";
import { config } from "../../config";

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

describe("CalComService", () => {
  let calcomService: CalComService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios.create
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      defaults: {
        headers: {},
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    calcomService = new CalComService();
  });

  describe("constructor", () => {
    it("should initialize with correct configuration", () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: "https://api.cal.com/v2",
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-api-key",
        },
      });
    });

    it("should setup request and response interceptors", () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe("validateConnection", () => {
    it("should return true when API connection is successful", async () => {
      const mockResponse = {
        status: 200,
        data: { id: 1, name: "Test User" },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await calcomService.validateConnection();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/me", {
        headers: {},
      });
    });

    it("should return false when API connection fails", async () => {
      const mockError = new Error("Network error");
      mockAxiosInstance.get.mockRejectedValue(mockError);

      const result = await calcomService.validateConnection();

      expect(result).toBe(false);
    });

    it("should include correlation ID in headers when provided", async () => {
      const correlationId = "test-correlation-id";
      const mockResponse = {
        status: 200,
        data: { id: 1, name: "Test User" },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await calcomService.validateConnection(correlationId);

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/me", {
        headers: { "x-correlation-id": correlationId },
      });
    });
  });

  describe("setCorrelationId", () => {
    it("should set correlation ID in default headers", () => {
      const correlationId = "test-correlation-id";

      calcomService.setCorrelationId(correlationId);

      expect(mockAxiosInstance.defaults.headers["x-correlation-id"]).toBe(
        correlationId
      );
    });
  });

  describe("clearCorrelationId", () => {
    it("should remove correlation ID from default headers", () => {
      const correlationId = "test-correlation-id";
      mockAxiosInstance.defaults.headers["x-correlation-id"] = correlationId;

      calcomService.clearCorrelationId();

      expect(
        mockAxiosInstance.defaults.headers["x-correlation-id"]
      ).toBeUndefined();
    });
  });

  describe("placeholder methods", () => {
    it("should throw not implemented error for getAvailableSlots", async () => {
      await expect(calcomService.getAvailableSlots({})).rejects.toThrow(
        "Method not implemented yet"
      );
    });

    it("should throw not implemented error for reserveSlot", async () => {
      const mockData = {
        eventTypeId: 1,
        start: "2023-12-01T10:00:00Z",
        responses: {
          name: "Test User",
          email: "test@example.com",
        },
      };

      await expect(calcomService.reserveSlot(mockData)).rejects.toThrow(
        "Method not implemented yet"
      );
    });

    it("should throw not implemented error for updateReservation", async () => {
      const mockData = {
        start: "2023-12-01T11:00:00Z",
      };

      await expect(
        calcomService.updateReservation("123", mockData)
      ).rejects.toThrow("Method not implemented yet");
    });
  });
});
