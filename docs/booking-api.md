# Booking API Documentation

## Overview

The Booking API allows you to create actual bookings (not temporary reservations) that will appear in your Cal.com dashboard. This API acts as a wrapper around Cal.com's v2 booking API, providing a simplified interface while maintaining full functionality.

## Key Differences: Reservations vs Bookings

### Slot Reservations (Temporary)

- **Endpoint**: `/slots/reservations` (Cal.com internal)
- **Purpose**: Temporary hold on a time slot (15-30 minutes)
- **Visibility**: Does NOT appear in Cal.com dashboard
- **Use case**: Holding a slot while user fills out a form

### Bookings (Permanent)

- **Endpoint**: `/api/slots/reserve` (our API) → `/v2/bookings` (Cal.com)
- **Purpose**: Permanent booking with calendar event
- **Visibility**: Appears in Cal.com dashboard and calendar
- **Use case**: Confirmed appointments

## API Endpoint

### Create a Booking

**POST** `/api/slots/reserve`

Creates a permanent booking that will appear in your Cal.com dashboard.

#### Request Headers

```http
Content-Type: application/json
x-correlation-id: optional-tracking-id
```

#### Request Body

```json
{
  "eventTypeId": "3139331",
  "start": "2025-09-10T14:00:00.000Z",
  "end": "2025-09-10T14:30:00.000Z",
  "attendee": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "timezone": "UTC",
  "metadata": {
    "location": "123 Main St, City, State",
    "notes": "Please bring ID for verification",
    "customField": "customValue"
  }
}
```

#### Request Parameters

| Field               | Type   | Required | Description                         |
| ------------------- | ------ | -------- | ----------------------------------- |
| `eventTypeId`       | string | Yes      | The ID of the Cal.com event type    |
| `start`             | string | Yes      | Start time in ISO 8601 format (UTC) |
| `end`               | string | Yes      | End time in ISO 8601 format (UTC)   |
| `attendee`          | object | Yes      | Attendee information                |
| `attendee.name`     | string | Yes      | Full name of the attendee           |
| `attendee.email`    | string | Yes      | Email address of the attendee       |
| `timezone`          | string | No       | Timezone (defaults to "UTC")        |
| `metadata`          | object | No       | Additional booking information      |
| `metadata.location` | string | No       | Meeting location or address         |
| `metadata.notes`    | string | No       | Additional notes for the booking    |

#### Success Response (201 Created)

```json
{
  "reservationId": "fNjNdZPcD55W4xaxbKRtTZ",
  "status": "confirmed",
  "eventDetails": {
    "start": "2025-09-10T14:00:00.000Z",
    "end": "2025-09-10T14:30:00.000Z",
    "eventTypeId": "3139331"
  },
  "attendee": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

#### Error Response (4xx/5xx)

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The requested slot is no longer available",
    "details": "Time slot conflicts with existing booking",
    "timestamp": "2025-09-03T10:30:00.000Z"
  }
}
```

## Error Codes

| Code                    | HTTP Status | Description                       |
| ----------------------- | ----------- | --------------------------------- |
| `VALIDATION_ERROR`      | 400         | Invalid request parameters        |
| `AUTHENTICATION_ERROR`  | 401         | Cal.com API authentication failed |
| `EVENT_TYPE_NOT_FOUND`  | 404         | Event type does not exist         |
| `SLOT_UNAVAILABLE`      | 409         | Time slot is no longer available  |
| `INTERNAL_SERVER_ERROR` | 500         | Server error occurred             |

## Examples

### Basic Booking

```bash
curl -X POST http://localhost:3000/api/slots/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypeId": "3139331",
    "start": "2025-09-10T14:00:00.000Z",
    "end": "2025-09-10T14:30:00.000Z",
    "attendee": {
      "name": "Jane Smith",
      "email": "jane.smith@example.com"
    },
    "timezone": "America/New_York"
  }'
```

### Booking with Location and Notes

```bash
curl -X POST http://localhost:3000/api/slots/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypeId": "3139331",
    "start": "2025-09-10T14:00:00.000Z",
    "end": "2025-09-10T14:30:00.000Z",
    "attendee": {
      "name": "Bob Johnson",
      "email": "bob.johnson@example.com"
    },
    "timezone": "UTC",
    "metadata": {
      "location": "Conference Room A, 2nd Floor",
      "notes": "Bring laptop and presentation materials",
      "department": "Engineering",
      "priority": "high"
    }
  }'
```

### JavaScript/Node.js Example

```javascript
const axios = require("axios");

async function createBooking() {
  try {
    const response = await axios.post(
      "http://localhost:3000/api/slots/reserve",
      {
        eventTypeId: "3139331",
        start: "2025-09-10T14:00:00.000Z",
        end: "2025-09-10T14:30:00.000Z",
        attendee: {
          name: "Alice Cooper",
          email: "alice.cooper@example.com",
        },
        timezone: "UTC",
        metadata: {
          location: "Virtual Meeting",
          notes: "First consultation call",
        },
      }
    );

    console.log("Booking created:", response.data);
    console.log("Booking ID:", response.data.reservationId);
  } catch (error) {
    console.error("Booking failed:", error.response?.data || error.message);
  }
}

createBooking();
```

### Python Example

```python
import requests
import json
from datetime import datetime, timedelta

def create_booking():
    url = "http://localhost:3000/api/slots/reserve"

    # Book for tomorrow at 2 PM
    tomorrow = datetime.now() + timedelta(days=1)
    start_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)
    end_time = start_time + timedelta(minutes=30)

    booking_data = {
        "eventTypeId": "3139331",
        "start": start_time.isoformat() + "Z",
        "end": end_time.isoformat() + "Z",
        "attendee": {
            "name": "Charlie Brown",
            "email": "charlie.brown@example.com"
        },
        "timezone": "UTC",
        "metadata": {
            "location": "Phone Call",
            "notes": "Follow-up consultation"
        }
    }

    try:
        response = requests.post(url, json=booking_data)
        response.raise_for_status()

        result = response.json()
        print(f"Booking created: {result['reservationId']}")
        print(f"Status: {result['status']}")

    except requests.exceptions.RequestException as e:
        print(f"Booking failed: {e}")

create_booking()
```

## Important Notes

### Time Zones

- All times must be provided in UTC format
- The `timezone` field is used for the attendee's display timezone
- Cal.com will handle timezone conversion for display purposes

### Event Type ID

- Must be a valid Cal.com event type ID that you have access to
- You can find event type IDs in your Cal.com dashboard or via the event types API

### Booking Confirmation

- Bookings are immediately confirmed and appear in your Cal.com dashboard
- Confirmation emails are sent automatically by Cal.com
- Calendar events are created in the organizer's calendar

### Rate Limits

- Follows Cal.com's API rate limits
- Recommended to implement retry logic with exponential backoff

### Validation

- Start time must be in the future
- End time must be after start time
- Email addresses must be valid format
- Event type must exist and be accessible

## Testing

You can test the booking functionality using the provided test script:

```bash
node test-booking-simple.js
```

This will:

1. Verify Cal.com API connectivity
2. Create a test booking
3. Test the API endpoint

## Troubleshooting

### Common Issues

1. **404 Event Type Not Found**

   - Verify the event type ID exists in your Cal.com account
   - Check that the event type is active and published

2. **409 Slot Unavailable**

   - The requested time slot is already booked
   - Check available slots first using the slots API

3. **401 Authentication Error**

   - Verify your Cal.com API key is correct
   - Ensure the API key has the necessary permissions

4. **Booking Not Appearing in Dashboard**
   - This was the original issue - now resolved by using `/v2/bookings` instead of `/slots/reservations`
   - Bookings should appear immediately in your Cal.com dashboard

### Debug Mode

Enable debug logging by setting the log level:

```bash
LOG_LEVEL=debug npm start
```

This will show detailed Cal.com API requests and responses for troubleshooting.
