import { DateResponse } from "../types/api";
import { logger } from "../utils/logger";

export class DateService {
  /**
   * Gets the current date and time
   * @returns Current date as Date object
   */
  getCurrentDate(): Date {
    const currentDate = new Date();
    logger.debug("Generated current date", { date: currentDate.toISOString() });
    return currentDate;
  }

  /**
   * Formats a date to ISO 8601 string format
   * @param date - Date to format
   * @returns ISO 8601 formatted date string
   */
  formatDate(date: Date): string {
    const formatted = date.toISOString();
    logger.debug("Formatted date to ISO string", {
      originalDate: date.toString(),
      formattedDate: formatted,
    });
    return formatted;
  }

  /**
   * Formats a date to a specific timezone
   * @param date - Date to format
   * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
   * @returns Formatted date string in the specified timezone
   */
  formatDateInTimezone(date: Date, timezone: string): string {
    try {
      // Use Intl.DateTimeFormat to format date in specific timezone
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const parts = formatter.formatToParts(date);
      const formattedParts: { [key: string]: string } = {};

      parts.forEach((part) => {
        formattedParts[part.type] = part.value;
      });

      // Construct ISO-like format with timezone offset
      const isoString = `${formattedParts.year}-${formattedParts.month}-${formattedParts.day}T${formattedParts.hour}:${formattedParts.minute}:${formattedParts.second}`;

      // Get timezone offset
      const tempDate = new Date(
        date.toLocaleString("en-US", { timeZone: timezone })
      );
      const utcDate = new Date(
        date.toLocaleString("en-US", { timeZone: "UTC" })
      );
      const offsetMs = utcDate.getTime() - tempDate.getTime();
      const offsetHours = Math.floor(Math.abs(offsetMs) / (1000 * 60 * 60));
      const offsetMinutes = Math.floor(
        (Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60)
      );
      const offsetSign = offsetMs <= 0 ? "+" : "-";
      const offsetString = `${offsetSign}${offsetHours
        .toString()
        .padStart(2, "0")}:${offsetMinutes.toString().padStart(2, "0")}`;

      const result = `${isoString}${offsetString}`;

      logger.debug("Formatted date in timezone", {
        originalDate: date.toString(),
        timezone,
        formattedDate: result,
      });

      return result;
    } catch (error) {
      logger.error("Error formatting date in timezone", {
        timezone,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Fallback to UTC if timezone formatting fails
      return this.formatDate(date);
    }
  }

  /**
   * Validates if a timezone string is valid
   * @param timezone - IANA timezone identifier
   * @returns true if valid, false otherwise
   */
  isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets current date formatted as DateResponse
   * @param timezone - Optional IANA timezone identifier
   * @returns DateResponse with current date and timestamp
   */
  getCurrentDateResponse(timezone?: string): DateResponse {
    try {
      const currentDate = this.getCurrentDate();
      const utcDate = this.formatDate(currentDate);

      let formattedDate = utcDate;
      let usedTimezone: string | undefined;

      if (timezone) {
        if (this.isValidTimezone(timezone)) {
          formattedDate = this.formatDateInTimezone(currentDate, timezone);
          usedTimezone = timezone;
        } else {
          logger.warn("Invalid timezone provided, falling back to UTC", {
            timezone,
          });
        }
      }

      const response: DateResponse = {
        currentDate: formattedDate,
        timestamp: currentDate.getTime(),
        timezone: usedTimezone,
        utcDate: utcDate,
      };

      logger.info("Generated date response", {
        currentDate: response.currentDate,
        timestamp: response.timestamp,
        timezone: response.timezone,
        utcDate: response.utcDate,
      });

      return response;
    } catch (error) {
      logger.error("Error generating date response", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error("Failed to generate current date response");
    }
  }
}
