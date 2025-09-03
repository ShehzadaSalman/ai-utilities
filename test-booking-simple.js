const axios = require("axios");
require("dotenv").config();

async function testBookingAPI() {
  console.log("🔍 Testing Cal.com Booking API...\n");

  const calcomApi = axios.create({
    baseURL: process.env.CALCOM_BASE_URL || "https://api.cal.com",
    headers: {
      Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-08-13",
    },
  });

  // Test 1: Check authentication
  console.log("1. Testing Authentication:");
  try {
    const authResponse = await calcomApi.get("/v2/me");
    console.log("   Auth Status: ✓ Connected");
    console.log("   User:", authResponse.data?.data?.username || "Unknown");
  } catch (error) {
    console.log("   Auth Status: ✗ Failed");
    console.log(
      "   Error:",
      error.response?.status,
      error.response?.data?.message || error.message
    );
    return;
  }
  console.log("");

  // Test 2: Create a booking for next week
  console.log("2. Creating Booking:");

  // Use a specific future date/time
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // Next week
  futureDate.setHours(14, 0, 0, 0); // 2 PM

  const bookingData = {
    eventTypeId: 3139331,
    start: futureDate.toISOString(),
    attendee: {
      name: "Test User",
      email: "test@example.com",
      timeZone: "UTC",
      language: "en",
    },
  };

  console.log("   Booking data:", JSON.stringify(bookingData, null, 2));

  try {
    const bookingResponse = await calcomApi.post("/v2/bookings", bookingData);
    console.log("   Booking creation: ✓ SUCCESS!");
    console.log("   Booking ID:", bookingResponse.data?.data?.id);
    console.log("   Booking UID:", bookingResponse.data?.data?.uid);
    console.log("   Status:", bookingResponse.data?.data?.status);
    console.log("   Start time:", bookingResponse.data?.data?.startTime);
    console.log("   End time:", bookingResponse.data?.data?.endTime);
    console.log("   Title:", bookingResponse.data?.data?.title);

    console.log(
      "\n   🎉 This booking should now appear in your Cal.com dashboard!"
    );
  } catch (error) {
    console.log("   Booking creation: ✗ Failed");
    console.log("   Status:", error.response?.status);
    console.log("   Error:", error.response?.data?.message || error.message);

    if (error.response?.data) {
      console.log(
        "   Full error response:",
        JSON.stringify(error.response.data, null, 2)
      );
    }

    // If it's a time conflict, that's actually good - it means the API is working
    if (
      error.response?.status === 409 ||
      error.response?.data?.message?.includes("conflict")
    ) {
      console.log(
        "\n   ℹ️  Time conflict error is expected - it means the booking API is working!"
      );
      console.log(
        "   Try a different time slot or check your Cal.com availability settings."
      );
    }
  }
  console.log("");

  // Test 3: Test our API endpoint
  console.log("3. Testing Our API Endpoint:");
  try {
    const ourApiResponse = await axios.post(
      "http://localhost:3000/api/slots/reserve",
      {
        eventTypeId: "3139331",
        start: futureDate.toISOString(),
        end: new Date(futureDate.getTime() + 30 * 60 * 1000).toISOString(), // 30 minutes later
        attendee: {
          name: "Test User",
          email: "test@example.com",
        },
        timezone: "UTC",
      }
    );

    console.log("   Our API: ✓ Success");
    console.log("   Reservation ID:", ourApiResponse.data?.reservationId);
    console.log("   Status:", ourApiResponse.data?.status);
  } catch (error) {
    console.log("   Our API: ✗ Failed");
    console.log(
      "   Error:",
      error.response?.status,
      error.response?.data?.error?.message || error.message
    );

    if (error.code === "ECONNREFUSED") {
      console.log("   ℹ️  Make sure your server is running on port 3000");
    }
  }
}

testBookingAPI().catch(console.error);
