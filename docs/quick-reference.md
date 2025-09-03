# Quick Reference - Booking API

```javascript
// This creates permanent bookings that appear in Cal.com dashboard
POST /v2/bookings
{
  "eventTypeId": 3139331,
  "start": "2025-09-10T14:00:00.000Z",
  "attendee": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "timeZone": "UTC",
    "language": "en"
  }
}
```

## Key Changes Made

1. **Endpoint**: `/slots/reservations` → `/v2/bookings`
2. **Data Structure**: `responses` → `attendee`
3. **API Version**: `2024-09-04` → `2024-08-13`
4. **Base URL**: `https://api.cal.com/v2` → `https://api.cal.com`

## Quick Test

```bash
# Test the booking creation
node test-booking-simple.js

# Expected output:
# ✓ Booking creation: SUCCESS!
# 🎉 This booking should now appear in your Cal.com dashboard!
```

## Minimal Working Example

```javascript
const bookingData = {
  eventTypeId: 3139331,
  start: "2025-09-10T14:00:00.000Z",
  attendee: {
    name: "Test User",
    email: "test@example.com",
    timeZone: "UTC",
    language: "en",
  },
};

const response = await axios.post(
  "https://api.cal.com/v2/bookings",
  bookingData,
  {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-08-13",
    },
  }
);
```

## Status Check

After booking, check your Cal.com dashboard at: https://app.cal.com/bookings

The booking should appear immediately with:

- ✅ Booking ID and UID
- ✅ Attendee information
- ✅ Scheduled time
- ✅ Status: "accepted"
