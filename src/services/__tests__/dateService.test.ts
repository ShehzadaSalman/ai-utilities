import { DateService } from "../dateService";

describe("DateService", () => {
  let dateService: DateService;

  beforeEach(() => {
    dateService = new DateService();
  });

  describe("getCurrentDate", () => {
    it("should return a Date object", () => {
      const result = dateService.getCurrentDate();
      expect(result).toBeInstanceOf(Date);
    });

    it("should return current date within reasonable time range", () => {
      const before = new Date();
      const result = dateService.getCurrentDate();
      const after = new Date();

      expect(result.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("formatDate", () => {
    it("should format date to ISO 8601 string", () => {
      const testDate = new Date("2023-12-01T10:30:00.000Z");
      const result = dateService.formatDate(testDate);

      expect(result).toBe("2023-12-01T10:30:00.000Z");
      expect(typeof result).toBe("string");
    });

    it("should handle different date formats consistently", () => {
      const testDate1 = new Date("2023-01-01T00:00:00.000Z");
      const testDate2 = new Date("2023-12-31T23:59:59.999Z");

      const result1 = dateService.formatDate(testDate1);
      const result2 = dateService.formatDate(testDate2);

      expect(result1).toBe("2023-01-01T00:00:00.000Z");
      expect(result2).toBe("2023-12-31T23:59:59.999Z");
    });
  });

  describe("getCurrentDateResponse", () => {
    it("should return DateResponse with current date and timestamp", () => {
      const result = dateService.getCurrentDateResponse();

      expect(result).toHaveProperty("currentDate");
      expect(result).toHaveProperty("timestamp");
      expect(typeof result.currentDate).toBe("string");
      expect(typeof result.timestamp).toBe("number");
    });

    it("should return ISO 8601 formatted date string", () => {
      const result = dateService.getCurrentDateResponse();

      // Check if it's a valid ISO 8601 format
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(result.currentDate).toMatch(isoRegex);
    });

    it("should have matching timestamp and currentDate", () => {
      const result = dateService.getCurrentDateResponse();
      const parsedDate = new Date(result.currentDate);

      expect(parsedDate.getTime()).toBe(result.timestamp);
    });

    it("should return current time within reasonable range", () => {
      const before = Date.now();
      const result = dateService.getCurrentDateResponse();
      const after = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
