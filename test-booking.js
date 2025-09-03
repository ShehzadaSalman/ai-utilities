const axios = require("axios");
require("dotenv").config();

async function testBookingCreation() {
  console.log("🔍 Testing Booking Creation...\n");

  const calcomApi = axios.create({
    baseURL: process.env.CALCOM_BASE_URL || "https://api.cal.com/v2",
    headers: {
      Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-09-04",
    },
  });

  // Test 1: Check authentication
  console.log("1. Testing Authentication:");
  try {
    const authResponse = await calcomApi.get("/me");
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

  // Test 2: Get available slots first
  console.log("2. Getting Available Slots:");
  const today = new Date();

  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  const startDate = today.toISOString();
  const endDate = nextMonth.toISOString();

  let availableSlot = null;

  try {
    const slotsUrl = `/slots?eventTypeId=3139331&start=${encodeURIComponent(
      startDate
    )}&end=${encodeURIComponent(endDate)}`;
    const slotsResponse = await calcomApi.get(slotsUrl);

    console.log("   Slots request: ✓ Success");

    // Find first available slot
    if (slotsResponse.data?.data?.slots) {
      for (const [date, slots] of Object.entries(
        slotsResponse.data.data.slots
      )) {
        for (const slot of slots) {
          if (!slot.bookingUid) {
            // Available slot
            availableSlot = slot.time;
            console.log("   Found available slot:", availableSlot);
            break;
          }
        }
        if (availableSlot) break;
      }
    }

    if (!availableSlot) {
      console.log("   No available slots found in the date range");
      return;
    }
  } catch (error) {
    console.log("   Slots request: ✗ Failed");
    console.log(
      "   Error:",
      error.response?.status,
      error.response?.data?.message || error.message
    );
    return;
  }
  console.log("");

  // Test 3: Create a booking
  console.log("3. Creating Booking:");
  const bookingData = {
    eventTypeId: 3139331,
    start: availableSlot,
    responses: {
      name: "Test User",
      email: "test@example.com",
    },
    timeZone: "UTC",
  };

  console.log("   Booking data:", JSON.stringify(bookingData, null, 2));

  try {
    const bookingResponse = await calcomApi.post("/bookings", bookingData);
    console.log("   Booking creation: ✓ Success");
    console.log(
      "   Booking ID:",
      bookingResponse.data?.data?.id || bookingResponse.data?.data?.uid
    );
    console.log("   Status:", bookingResponse.data?.status);
    console.log("   Start time:", bookingResponse.data?.data?.startTime);
    console.log("   End time:", bookingResponse.data?.data?.endTime);

    // Show full response for debugging
    console.log(
      "   Full response:",
      JSON.stringify(bookingResponse.data, null, 2)
    );
  } catch (error) {
    console.log("   Booking creation: ✗ Failed");
    console.log(
      "   Error:",
      error.response?.status,
      error.response?.data?.message || error.message
    );

    if (error.response?.data) {
      console.log(
        "   Full error response:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
  console.log("");

  // Test 4: Try the old slots/reservations endpoint for comparison
  console.log("4. Testing Slots Reservations (for comparison):");
  const reservationData = {
    eventTypeId: 3139331,
    slotStart: availableSlot,
  };

  try {
    const reservationResponse = await calcomApi.post(
      "/slots/reservations",
      reservationData
    );
    console.log("   Slot reservation: ✓ Success");
    console.log(
      "   Reservation UID:",
      reservationResponse.data?.data?.reservationUid
    );
    console.log("   Status:", reservationResponse.data?.status);
    console.log(
      "   Duration:",
      reservationResponse.data?.data?.reservationDuration,
      "minutes"
    );
    console.log(
      "   Expires:",
      reservationResponse.data?.data?.reservationUntil
    );
  } catch (error) {
    console.log("   Slot reservation: ✗ Failed");
    console.log(
      "   Error:",
      error.response?.status,
      error.response?.data?.message || error.message
    );
  }
}

testBookingCreation().catch(console.error);
