const axios = require("axios");
require("dotenv").config();

async function comprehensiveTest() {
  console.log("🔍 Comprehensive Cal.com API Debug...\n");

  const calcomApi = axios.create({
    baseURL: process.env.CALCOM_BASE_URL || "https://api.cal.com/v2",
    headers: {
      Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-09-04",
    },
  });

  // Test 1: Get event types to see what's available
  console.log("1. Getting Available Event Types:");
  try {
    const eventTypesResponse = await calcomApi.get("/event-types");
    console.log(
      "   Event Types Found:",
      eventTypesResponse.data?.data?.length || 0
    );

    if (eventTypesResponse.data?.data?.length > 0) {
      eventTypesResponse.data.data.slice(0, 3).forEach((eventType, index) => {
        console.log(
          `   ${index + 1}. ID: ${eventType.id}, Title: "${
            eventType.title
          }", Length: ${eventType.length}min`
        );
      });
    }
  } catch (error) {
    console.log(
      "   Failed to get event types:",
      error.response?.status,
      error.message
    );
  }
  console.log("");

  // Test 2: Try different date ranges
  console.log("2. Testing Different Date Ranges:");

  const testRanges = [
    // Next 30 days
    {
      name: "Next 30 days",
      start: new Date(),
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    // Next week
    {
      name: "Next 7 days",
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    // Tomorrow to next week
    {
      name: "Tomorrow to next week",
      start: new Date(Date.now() + 24 * 60 * 60 * 1000),
      end: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const range of testRanges) {
    const startDate = range.start.toISOString().split(".")[0];
    const endDate = range.end.toISOString().split(".")[0];

    console.log(`   Testing ${range.name}:`);
    console.log(`     ${startDate} to ${endDate}`);

    try {
      const url = `/slots?eventTypeId=3139331&start=${encodeURIComponent(
        startDate
      )}&end=${encodeURIComponent(endDate)}`;
      const response = await calcomApi.get(url);

      let totalSlots = 0;
      if (response.data?.data?.slots) {
        Object.values(response.data.data.slots).forEach((dateSlots) => {
          totalSlots += dateSlots.length;
        });
      }

      console.log(`     Result: ${totalSlots} slots found`);

      // Show first few slots if any
      if (totalSlots > 0 && response.data?.data?.slots) {
        const firstDate = Object.keys(response.data.data.slots)[0];
        const firstSlots = response.data.data.slots[firstDate];
        console.log(`     First slot: ${firstSlots[0]?.time}`);
      }
    } catch (error) {
      console.log(
        `     Error: ${error.response?.status} ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
  console.log("");

  // Test 3: Try with timezone
  console.log("3. Testing with Different Timezones:");
  const timezones = [
    "UTC",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/London",
  ];

  const today = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const startDate = today.toISOString().split(".")[0];
  const endDate = nextWeek.toISOString().split(".")[0];

  for (const tz of timezones) {
    try {
      const url = `/slots?eventTypeId=3139331&start=${encodeURIComponent(
        startDate
      )}&end=${encodeURIComponent(endDate)}&timeZone=${encodeURIComponent(tz)}`;
      const response = await calcomApi.get(url);

      let totalSlots = 0;
      if (response.data?.data?.slots) {
        Object.values(response.data.data.slots).forEach((dateSlots) => {
          totalSlots += dateSlots.length;
        });
      }

      console.log(`   ${tz}: ${totalSlots} slots`);
    } catch (error) {
      console.log(`   ${tz}: Error ${error.response?.status}`);
    }
  }
  console.log("");

  // Test 4: Check if eventTypeId exists
  console.log("4. Checking EventTypeId 3139331:");
  try {
    const eventTypeResponse = await calcomApi.get("/event-types/3139331");
    console.log("   EventType exists: ✓");
    console.log("   Title:", eventTypeResponse.data?.data?.title);
    console.log("   Length:", eventTypeResponse.data?.data?.length, "minutes");
    console.log(
      "   Active:",
      eventTypeResponse.data?.data?.hidden ? "Hidden" : "Active"
    );
  } catch (error) {
    console.log("   EventType check: ✗ Failed");
    console.log(
      "   Error:",
      error.response?.status,
      error.response?.data?.message || error.message
    );
  }
}

comprehensiveTest().catch(console.error);
