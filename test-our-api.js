const axios = require("axios");

async function testOurAPI() {
  console.log("🔍 Testing Our Booking API...\n");

  // Test our API endpoint
  console.log("1. Testing Our API Endpoint:");
  
  // Use a time far in the future to avoid conflicts
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14); // 2 weeks from now
  futureDate.setHours(15, 0, 0, 0); // 3 PM
  
  const endDate = new Date(futureDate);
  endDate.setMinutes(30); // 30 minutes later
  
  const bookingData = {
    eventTypeId: "3139331",
    start: futureDate.toISOString(),
    end: endDate.toISOString(),
    attendee: {
      name: 