const axios = require("axios");
require("dotenv").config();

async function testEndpoints() {
  console.log("🔍 Testing Cal.com API Endpoints...\n");

  const calcomApi = axios.create({
    baseURL: process.env.CALCOM_BASE_URL || "https://api.cal.com/v2",
    headers: {
      Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-09-04",
    },
  });

  // Test different endpoints to see what's available
  const endpoints = [
    "/me",
    "/event-types",
    "/bookings",
    "/slots",
    "/slots/reservations",
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}:`);
      const response = await calcomApi.get(endpoint);
      console.log(`   ✓ GET ${endpoint} - Status: ${response.status}`);
    } catch (error) {
      console.log(
        `   ✗ GET ${endpoint} - Status: ${error.response?.status} - ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  console.log("\nTesting POST endpoints:");

  // Test POST to bookings with minimal data
  try {
    console.log("Testing POST /bookings:");
    const response = await calcomApi.post("/bookings", {
      eventTypeId: 3139331,
      start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      responses: {
        name: "Test",
        email: "test@test.com",
      },
    });
    console.log(`   ✓ POST /bookings - Status: ${response.status}`);
  } catch (error) {
    console.log(
      `   ✗ POST /bookings - Status: ${error.response?.status} - ${
        error.response?.data?.message || error.message
      }`
    );
    if (error.response?.data) {
      console.log(
        "   Full error:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

testEndpoints().catch(console.error);
