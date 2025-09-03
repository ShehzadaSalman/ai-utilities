const axios = require("axios");
require("dotenv").config();

async function testCalcomResponse() {
  console.log("🔍 Testing Cal.com API Response...\n");

  const calcomApi = axios.create({
    baseURL: process.env.CALCOM_BASE_URL || "https://api.cal.com",
    headers: {
      Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-08-13",
    },
  });

  // Test with different times to avoid conflicts
  const testTimes = [
    { hours: 15, minutes: 0 }, // 3 PM
    { hours: 16, minutes: 0 }, // 4 PM
    { hours: 17, minutes: 0 }, // 5 PM
    { hours: 10, minutes: 0 }, // 10 AM
    { hours: 11, minutes: 0 }, // 11 AM
  ];

  for (let i = 0; i < testTimes.length; i++) {
    const testTime = testTimes[i];

    // Use a date further in the future to avoid conflicts
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14 + i); // 2+ weeks from now, different day for each test
    futureDate.setHours(testTime.hours, testTime.minutes, 0, 0);

    const bookingData = {
      eventTypeId: 3139331,
      start: futureDate.toISOString(),
      attendee: {
        name: `Test User ${i + 1}`,
        email: `test${i + 1}@example.com`,
        timeZone: "UTC",
        language: "en",
      },
    };

    console.log(`\n${i + 1}. Testing booking for ${futureDate.toISOString()}:`);
    console.log("   Request data:", JSON.stringify(bookingData, null, 2));

    try {
      const bookingResponse = await calcomApi.post("/v2/bookings", bookingData);

      console.log("   ✅ SUCCESS! Full Cal.com Response:");
      console.log("   Status:", bookingResponse.status);
      console.log(
        "   Response Data:",
        JSON.stringify(bookingResponse.data, null, 2)
      );

      // Break after first success to see the response structure
      break;
    } catch (error) {
      console.log("   ❌ Failed:");
      console.log("   Status:", error.response?.status);
      console.log(
        "   Error:",
        error.response?.data?.error?.message || error.message
      );

      if (error.response?.data) {
        console.log(
          "   Full Error Response:",
          JSON.stringify(error.response.data, null, 2)
        );
      }

      // Continue to next time slot
      continue;
    }
  }

  // Also test what happens with a successful slot reservation (the old way)
  console.log("\n\n🔍 Testing Slot Reservation (old way) for comparison:");

  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 20);
  futureDate2.setHours(14, 0, 0, 0);

  const reservationData = {
    eventTypeId: 3139331,
    slotStart: futureDate2.toISOString(),
  };

  console.log("Request data:", JSON.stringify(reservationData, null, 2));

  try {
    const reservationResponse = await calcomApi.post(
      "/v2/slots/reservations",
      reservationData
    );
    console.log("✅ Slot Reservation Response:");
    console.log("Status:", reservationResponse.status);
    console.log(
      "Response Data:",
      JSON.stringify(reservationResponse.data, null, 2)
    );
  } catch (error) {
    console.log("❌ Slot Reservation Failed:");
    console.log("Status:", error.response?.status);
    console.log(
      "Error:",
      error.response?.data?.error?.message || error.message
    );
    if (error.response?.data) {
      console.log(
        "Full Error Response:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

testCalcomResponse().catch(console.error);
