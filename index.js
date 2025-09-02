const express = require("express");
const axios = require("axios");
const cors = require("cors");
const moment = require("moment-timezone");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Cal.com API client
const calcomApi = axios.create({
  baseURL: process.env.CALCOM_BASE_URL || "https://api.cal.com/v2",
  headers: {
    Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
    "Content-Type": "application/json",
    "cal-api-version": "2024-09-04",
  },
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get current date
app.get("/api/date", (req, res) => {
  const now = new Date();
  res.json({
    currentDate: now.toISOString(),
    timestamp: now.getTime(),
  });
});

// Get available slots
app.get("/api/slots/available", async (req, res) => {
  try {
    const { eventTypeId, timezone } = req.query;

    if (!eventTypeId) {
      return res.status(400).json({ error: "eventTypeId is required" });
    }

    // Use moment for proper date handling
    // Set timezone (default to UTC if not provided)
    const tz = timezone || "UTC";

    // Get today at start of business hours (9 AM)
    const startMoment = moment.tz(tz).startOf("day").add(9, "hours");

    // Get 2 weeks from today at end of business hours (5 PM)
    const endMoment = moment
      .tz(tz)
      .add(14, "days")
      .startOf("day")
      .add(17, "hours");

    // Format dates exactly like Cal.com expects: YYYY-MM-DDTHH:mm:ss
    const startDate = startMoment.format("YYYY-MM-DDTHH:mm:ss");
    const endDate = endMoment.format("YYYY-MM-DDTHH:mm:ss");

    // Build query parameters manually to match your working sample format
    let queryString = `eventTypeId=${eventTypeId}&start=${encodeURIComponent(
      startDate
    )}&end=${encodeURIComponent(endDate)}`;
    if (timezone) {
      queryString += `&timeZone=${encodeURIComponent(timezone)}`;
    }

    const fullUrl = `/slots?${queryString}`;
    console.log(`Calling Cal.com API: ${fullUrl}`);
    console.log(`Date range: ${startDate} to ${endDate}`);

    const response = await calcomApi.get(fullUrl);

    console.log("Cal.com response:", JSON.stringify(response.data, null, 2));

    // Transform response to simple format
    const slots = [];
    if (response.data?.data?.slots) {
      Object.values(response.data.data.slots).forEach((dateSlots) => {
        dateSlots.forEach((slot) => {
          slots.push({
            start: slot.time,
            available: !slot.bookingUid,
          });
        });
      });
    }

    res.json({
      slots,
      eventTypeId,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      totalSlots: slots.length,
      availableSlots: slots.filter((slot) => slot.available).length,
    });
  } catch (error) {
    console.error("Error fetching slots:", error.message);
    console.error("Error response:", error.response?.data);
    res.status(500).json({
      error: "Failed to fetch available slots",
      details: error.response?.data || error.message,
    });
  }
});

// Reserve a slot
app.post("/api/slots/reserve", async (req, res) => {
  try {
    const { eventTypeId, start, attendee } = req.body;

    if (!eventTypeId || !start || !attendee?.email) {
      return res
        .status(400)
        .json({ error: "eventTypeId, start, and attendee.email are required" });
    }

    const reservationData = {
      eventTypeId: parseInt(eventTypeId),
      slotStart: start,
      attendee,
    };

    const response = await calcomApi.post(
      "/slots/reservations",
      reservationData
    );

    res.status(201).json({
      reservationId: response.data.data?.reservationUid,
      status: "confirmed",
      start: start,
      attendee: attendee,
    });
  } catch (error) {
    console.error("Error reserving slot:", error.message);

    if (error.response?.status === 409) {
      return res.status(409).json({ error: "Slot no longer available" });
    }

    res.status(500).json({ error: "Failed to reserve slot" });
  }
});

// Update reservation
app.put("/api/slots/:reservationId", async (req, res) => {
  try {
    const { reservationId } = req.params;
    const updateData = req.body;

    const response = await calcomApi.patch(
      `/bookings/${reservationId}`,
      updateData
    );

    res.json({
      reservationId,
      status: "updated",
      ...updateData,
    });
  } catch (error) {
    console.error("Error updating reservation:", error.message);

    if (error.response?.status === 404) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    res.status(500).json({ error: "Failed to update reservation" });
  }
});

// Test Cal.com connection
app.get("/api/test-calcom", async (req, res) => {
  try {
    await calcomApi.get("/me");
    res.json({ status: "connected" });
  } catch (error) {
    console.error("Cal.com connection test failed:", error.message);
    res.status(500).json({ status: "failed", error: error.message });
  }
});

// Test slots endpoint exactly like your working sample
app.get("/api/test-slots", async (req, res) => {
  try {
    const url =
      "/slots?start=2025-09-03T10%3A00%3A00&end=2025-09-20T10%3A00%3A00&eventTypeId=3139331";
    console.log(`Testing Cal.com API: ${url}`);

    const response = await calcomApi.get(url);

    console.log("Test response:", JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    console.error("Test slots failed:", error.message);
    console.error("Error response:", error.response?.data);
    res.status(500).json({
      status: "failed",
      error: error.message,
      details: error.response?.data,
    });
  }
});

// Debug endpoint to compare our dates vs working sample
app.get("/api/debug-dates", (req, res) => {
  const { timezone } = req.query;
  const tz = timezone || "UTC";

  // Using moment for proper date handling
  const startMoment = moment.tz(tz).startOf("day").add(9, "hours");
  const endMoment = moment
    .tz(tz)
    .add(14, "days")
    .startOf("day")
    .add(17, "hours");

  const startDate = startMoment.format("YYYY-MM-DDTHH:mm:ss");
  const endDate = endMoment.format("YYYY-MM-DDTHH:mm:ss");

  // URL encode like your working sample
  const encodedStart = encodeURIComponent(startDate);
  const encodedEnd = encodeURIComponent(endDate);

  res.json({
    timezone: tz,
    workingSample: {
      start: "2025-09-03T10:00:00",
      end: "2025-09-20T10:00:00",
      encoded: {
        start: "2025-09-03T10%3A00%3A00",
        end: "2025-09-20T10%3A00%3A00",
      },
    },
    ourDates: {
      start: startDate,
      end: endDate,
      encoded: {
        start: encodedStart,
        end: encodedEnd,
      },
    },
    momentInfo: {
      startMoment: startMoment.toString(),
      endMoment: endMoment.toString(),
      currentTime: moment.tz(tz).toString(),
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Calendar API ready!`);
});
