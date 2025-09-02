const axios = require("axios");
require("dotenv").config();

async function testCalcomAPI() {
  console.log("🔍 Debugging Cal.com API...\n");

  // Check environment variables
  console.log("1. Environment Variables:");
  console.log(
    "   CALCOM_API_KEY:",
    process.env.CALCOM_API_KEY ? "Set ✓" : "Missing ✗"
  );
  console.log(
    "   CALCOM_BASE_URL:",
    process.env.CALCOM_BASE_URL || "https://api.cal.com/v2"
  );
  console.log("");

  const calcomApi = axios.create({
    baseURL: process.env.CALCOM_BASE_URL || "https://api.cal.com/v2",
    headers: {
      Authorization: `Bearer ${process.env.CALCOM_API_KEY}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-09-04",
    },
  });

  // Test 1: Check authentication
  console.log("2. Testing Authentication:");
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

  // Test 2: Try the exact working sample
  console.log("3. Testing Working Sample URL:");
  const workingUrl =
    "/slots?start=2025-09-03T10%3A00%3A00&end=2025-09-20T10%3A00%3A00&eventTypeId=3139331";
  try {
    const workingResponse = await calcomApi.get(workingUrl);
    console.log("   Working Sample: ✓ Success");
    console.log(
      "   Slots found:",
      Object.keys(workingResponse.data?.data?.slots || {}).length,
      "dates"
    );

    // Count total slots
    let totalSlots = 0;
    if (workingResponse.data?.data?.slots) {
      Object.values(workingResponse.data.data.slots).forEach((dateSlots) => {
        totalSlots += dateSlots.length;
      });
    }
    console.log("   Total slots:", totalSlots);
  } catch (error) {
    console.log("   Working Sample: ✗ Failed");
    console.log(
      "   Error:",
      error.response?.status,
      error.response?.data?.message || error.message
    );
  }
  console.log("");

  // Test 3: Try with current dates
  console.log("4. Testing Current Dates:");
  const today = new Date();
  const twoWeeks = new Date();
  twoWeeks.setDate(today.getDate() + 14);

  const startDate = today.toISOString().split(".")[0];
  const endDate = twoWeeks.toISOString().split(".")[0];

  console.log("   Start Date:", startDate);
  console.log("   End Date:", endDate);

  const currentUrl = `/slots?eventTypeId=3139331&start=${encodeURIComponent(
    startDate
  )}&end=${encodeURIComponent(endDate)}`;
  console.log("   URL:", currentUrl);

  try {
    const currentResponse = await calcomApi.get(currentUrl);
    console.log("   Current Dates: ✓ Success");
    console.log(
      "   Slots found:",
      Object.keys(currentResponse.data?.data?.slots || {}).length,
      "dates"
    );

    let totalSlots = 0;
    if (currentResponse.data?.data?.slots) {
      Object.values(currentResponse.data.data.slots).forEach((dateSlots) => {
        totalSlots += dateSlots.length;
      });
    }
    console.log("   Total slots:", totalSlots);
  } catch (error) {
    console.log("   Current Dates: ✗ Failed");
    console.log(
      "   Error:",
      error.response?.status,
      error.response?.data?.message || error.message
    );
    if (error.response?.data) {
      console.log("   Response:", JSON.stringify(error.response.data, null, 2));
    }
  }
  console.log("");

  // Test 4: Try different eventTypeId formats
  console.log("5. Testing Different EventTypeId Formats:");
  const testUrls = [
    `/slots?eventTypeId=3139331&start=${encodeURIComponent(
      startDate
    )}&end=${encodeURIComponent(endDate)}`,
    `/slots?eventTypeId="3139331"&start=${encodeURIComponent(
      startDate
    )}&end=${encodeURIComponent(endDate)}`,
    `/slots?event_type_id=3139331&start=${encodeURIComponent(
      startDate
    )}&end=${encodeURIComponent(endDate)}`,
  ];

  for (let i = 0; i < testUrls.length; i++) {
    try {
      const testResponse = await calcomApi.get(testUrls[i]);
      console.log(`   Format ${i + 1}: ✓ Success`);
    } catch (error) {
      console.log(`   Format ${i + 1}: ✗ Failed (${error.response?.status})`);
    }
  }
}

testCalcomAPI().catch(console.error);
