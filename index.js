const express = require("express");
const axios = require("axios");
const cors = require("cors");
const moment = require("moment-timezone");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const calcomApi = axios.create({
  baseURL: process.env.CALCOM_BASE_URL || "https://api.cal.com",
  headers: {
    Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
    "Content-Type": "application/json",
    "cal-api-version": "2024-08-13",
  },
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/date", (req, res) => {
  const now = new Date();
  res.json({
    currentDate: now.toISOString(),
    timestamp: now.getTime(),
  });
});

app.get("/api/slots/available", async (req, res) => {
  try {
    const { eventTypeId, timezone } = req.query;

    if (!eventTypeId) {
      return res.status(400).json({ error: "eventTypeId is required" });
    }

    const tz = timezone || "UTC";
    const startMoment = moment.tz(tz).startOf("day").add(9, "hours");
    const endMoment = moment
      .tz(tz)
      .add(14, "days")
      .startOf("day")
      .add(17, "hours");
    const startDate = startMoment.format("YYYY-MM-DDTHH:mm:ss");
    const endDate = endMoment.format("YYYY-MM-DDTHH:mm:ss");

    let queryString = `eventTypeId=${eventTypeId}&start=${encodeURIComponent(
      startDate
    )}&end=${encodeURIComponent(endDate)}`;
    if (timezone) {
      queryString += `&timeZone=${encodeURIComponent(timezone)}`;
    }

    const response = await calcomApi.get(`/slots?${queryString}`);

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching slots:", error.message);
    res.status(500).json({
      error: "Failed to fetch available slots",
      details: error.response?.data || error.message,
    });
  }
});

app.post("/api/slots/reserve", async (req, res) => {
  try {
    // Transform the request data to match Cal.com API format
    const bookingData = {
      eventTypeId: parseInt(req.body.eventTypeId, 10),
      start: req.body.start,
      attendee: {
        name: req.body.attendee.name,
        email: req.body.attendee.email,
        timeZone: req.body.timezone || "UTC",
        language: "en",
      },
    };

    const response = await calcomApi.post("/v2/bookings", bookingData);
    res.json(response.data);
  } catch (error) {
    console.error("Error reserving slot:", error.message);
    res
      .status(error.response?.status || 500)
      .json(error.response?.data || { error: "Failed to reserve slot" });
  }
});

app.put("/api/slots/:reservationId", async (req, res) => {
  try {
    const { reservationId } = req.params;
    const updateData = req.body;

    const response = await calcomApi.patch(
      `/bookings/${reservationId}`,
      updateData
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error updating reservation:", error.message);
    res.status(500).json({ error: "Failed to update reservation" });
  }
});

app.get("/api/test-calcom", async (req, res) => {
  try {
    const response = await calcomApi.get("/me");
    res.json(response.data);
  } catch (error) {
    console.error("Cal.com connection test failed:", error.message);
    res.status(500).json({ status: "failed", error: error.message });
  }
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error.message);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📅 Calendar API ready!`);
});
