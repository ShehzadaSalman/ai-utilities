import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { config } from "../config";
import { logger } from "../utils/logger";
import {
  CalComSlotsResponse,
  CalComReservationData,
  CalComReservationResponse,
  CalComUpdateData,
  CalComErrorResponse,
} from "../types/calcom";

export class CalComService {
  private httpClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = config.calcom.baseUrl;
    this.apiKey = config.calcom.apiKey;

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "cal-api-version": "2024-08-13",
      },
    });

    this.setupInterceptors();
    logger.info("CalComService initialized", { baseUrl: this.baseUrl });
  }

  private setupInterceptors(): void {
    // Request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        const correlationId = config.headers?.["x-correlation-id"] as string;
        logger.debug(
          "Making Cal.com API request",
          {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
          },
          correlationId
        );
        return config;
      },
      (error) => {
        logger.error("Cal.com API request error", { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.httpClient.interceptors.response.use(
      (response: AxiosResponse) => {
        const correlationId = response.config.headers?.[
          "x-correlation-id"
        ] as string;
        logger.debug(
          "Cal.com API response received",
          {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
          },
          correlationId
        );
        return response;
      },
      (error: AxiosError) => {
        return this.handleApiError(error);
      }
    );
  }

  private handleApiError(error: AxiosError): Promise<never> {
    const correlationId = error.config?.headers?.["x-correlation-id"] as string;

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as CalComErrorResponse;

      logger.error(
        "Cal.com API error response",
        {
          status,
          statusText: error.response.statusText,
          message: data?.message || "Unknown error",
          url: error.config?.url,
          responseData: data,
          requestData: error.config?.data,
        },
        correlationId
      );

      // Handle specific error cases
      switch (status) {
        case 401:
          throw new Error(
            `Cal.com API authentication failed: ${
              data?.message || "Please check your API key."
            }`
          );
        case 403:
          throw new Error(
            `Cal.com API access forbidden: ${
              data?.message || "Insufficient permissions."
            }`
          );
        case 404:
          throw new Error(
            `Cal.com API resource not found: ${
              data?.message || "Endpoint or resource not found."
            }`
          );
        case 409:
          throw new Error(
            `Cal.com API conflict: ${
              data?.message || "Resource may already exist or be unavailable."
            }`
          );
        case 429:
          throw new Error(
            `Cal.com API rate limit exceeded: ${
              data?.message || "Please try again later."
            }`
          );
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error(
            `Cal.com API server error: ${
              data?.message || "Please try again later."
            }`
          );
        default:
          throw new Error(
            `Cal.com API error (${status}): ${data?.message || "Unknown error"}`
          );
      }
    } else if (error.request) {
      // Request was made but no response received
      logger.error(
        "Cal.com API network error",
        {
          message: error.message,
          code: error.code,
          url: error.config?.url,
        },
        correlationId
      );
      throw new Error(
        "Cal.com API network error. Please check your connection."
      );
    } else {
      // Something else happened
      logger.error(
        "Cal.com API request setup error",
        {
          message: error.message,
        },
        correlationId
      );
      throw new Error("Cal.com API request failed to setup.");
    }
  }

  /**
   * Validates that the Cal.com API is accessible with current credentials
   */
  async validateConnection(correlationId?: string): Promise<boolean> {
    try {
      logger.info("Validating Cal.com API connection", {}, correlationId);

      // Make a simple request to validate credentials
      // Using a lightweight endpoint to check authentication
      const response = await this.httpClient.get("/v2/me", {
        headers: correlationId ? { "x-correlation-id": correlationId } : {},
      });

      logger.info(
        "Cal.com API connection validated successfully",
        {
          status: response.status,
        },
        correlationId
      );

      return true;
    } catch (error) {
      logger.error(
        "Cal.com API connection validation failed",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
        correlationId
      );
      return false;
    }
  }

  /**
   * Sets correlation ID for request tracking
   */
  setCorrelationId(correlationId: string): void {
    this.httpClient.defaults.headers["x-correlation-id"] = correlationId;
  }

  /**
   * Removes correlation ID from default headers
   */
  clearCorrelationId(): void {
    delete this.httpClient.defaults.headers["x-correlation-id"];
  }

  /**
   * Get available time slots for a specific event type
   */
  async getAvailableSlots(
    params: {
      eventTypeId: string;
      start?: string;
      end?: string;
      timezone?: string;
    },
    correlationId?: string
  ): Promise<CalComSlotsResponse> {
    try {
      logger.info(
        "Fetching available slots from Cal.com",
        {
          eventTypeId: params.eventTypeId,
          start: params.start,
          end: params.end,
          timezone: params.timezone,
        },
        correlationId
      );

      const queryParams = new URLSearchParams();
      queryParams.append("eventTypeId", params.eventTypeId);

      if (params.start) {
        queryParams.append("startTime", params.start);
      }

      if (params.end) {
        queryParams.append("endTime", params.end);
      }

      if (params.timezone) {
        queryParams.append("timeZone", params.timezone);
      }

      const response = await this.httpClient.get(
        `/v2/slots/available?${queryParams.toString()}`,
        {
          headers: correlationId ? { "x-correlation-id": correlationId } : {},
        }
      );

      logger.info(
        "Successfully fetched available slots",
        {
          eventTypeId: params.eventTypeId,
          slotsCount: response.data.data?.slots
            ? Object.values(response.data.data.slots).flat().length
            : 0,
        },
        correlationId
      );

      return response.data;
    } catch (error) {
      logger.error(
        "Failed to fetch available slots",
        {
          eventTypeId: params.eventTypeId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        correlationId
      );
      throw error;
    }
  }

  /**
   * Create a booking
   */
  async createBooking(
    data: CalComReservationData,
    correlationId?: string
  ): Promise<CalComReservationResponse> {
    try {
      logger.info(
        "Creating booking in Cal.com",
        {
          eventTypeId: data.eventTypeId,
          start: data.start,
          requestData: data,
        },
        correlationId
      );

      // Create actual booking instead of temporary reservation
      const response = await this.httpClient.post("/v2/bookings", data, {
        headers: {
          ...(correlationId && { "x-correlation-id": correlationId }),
          "cal-api-version": "2024-08-13",
        },
      });

      logger.info(
        "Successfully created booking",
        {
          bookingId: response.data.data?.id || response.data.data?.uid,
          eventTypeId: data.eventTypeId,
          start: data.start,
          status: response.data.status,
          fullResponse: response.data,
        },
        correlationId
      );

      return response.data;
    } catch (error) {
      logger.error(
        "Failed to create booking",
        {
          eventTypeId: data.eventTypeId,
          start: data.start,
          error: error instanceof Error ? error.message : "Unknown error",
          errorDetails: error,
        },
        correlationId
      );
      throw error;
    }
  }

  /**
   * Update an existing reservation
   */
  async updateReservation(
    id: string,
    data: CalComUpdateData,
    correlationId?: string
  ): Promise<CalComReservationResponse> {
    try {
      logger.info(
        "Updating reservation in Cal.com",
        {
          reservationId: id,
          start: data.start,
          attendeeEmail: data.responses?.email,
          attendeeName: data.responses?.name,
        },
        correlationId
      );

      const response = await this.httpClient.patch(`/v2/bookings/${id}`, data, {
        headers: correlationId ? { "x-correlation-id": correlationId } : {},
      });

      logger.info(
        "Successfully updated reservation",
        {
          reservationId: id,
          status: response.data.status,
          start: response.data.startTime,
        },
        correlationId
      );

      return response.data;
    } catch (error) {
      logger.error(
        "Failed to update reservation",
        {
          reservationId: id,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        correlationId
      );
      throw error;
    }
  }
}
