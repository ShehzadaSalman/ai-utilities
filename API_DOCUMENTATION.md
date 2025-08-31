# Calendar API Integration - Documentation

## Overview

This Express.js application provides a REST API that integrates with Cal.com to manage calendar operations including retrieving available time slots, reserving slots, and updating existing reservations.

## Table of Contents

- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Examples](#examples)

## Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Cal.com account with API access

### Installation Steps

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

3. **Configure your Cal.com credentials in `.env`:**

   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Cal.com API Configuration
   CALCOM_API_KEY=your_cal_com_api_key_here
   CALCOM_BASE_URL=https://api.cal.com/v2
   CALCOM_VERSION=v2

   # Logging Configuration
   LOG_LEVEL=info
   LOG_FORMAT=combined
   ```

4. **Build the application:**
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

| Variable          | Description                           | Required | Default                |
| ----------------- | ------------------------------------- | -------- | ---------------------- |
| `PORT`            | Server port                           | No       | 3000                   |
| `NODE_ENV`        | Environment (development/production)  | No       | development            |
| `CALCOM_API_KEY`  | Your Cal.com API key                  | Yes      | -                      |
| `CALCOM_BASE_URL` | Cal.com API base URL                  | No       | https://api.cal.com/v2 |
| `CALCOM_VERSION`  | Cal.com API version                   | No       | v2                     |
| `LOG_LEVEL`       | Logging level (debug/info/warn/error) | No       | info                   |
| `LOG_FORMAT`      | Log format (combined/json)            | No       | combined               |

### Getting Cal.com API Key

1. Log in to your Cal.com account
2. Go to Settings → Developer → API Keys
3. Create a new API key
4. Copy the key and add it to your `.env` file

## Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

### Health Check

Once running, verify the server is healthy:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2025-08-31T01:37:46.800Z"
}
```

## API Endpoints

### Base URL

```
http://localhost:3000/api
```

### 1. Get Current Date

**Endpoint:** `GET /api/date`

**Description:** Returns the current server date and time.

**Parameters:** None

**Response:**

```json
{
  "currentDate": "2025-08-31T01:37:46.800Z",
  "timestamp": 1756604266800,
  "timezone": "UTC",
  "utcDate": "2025-08-31T01:37:46.800Z"
}
```

**Example:**

```bash
curl http://localhost:3000/api/date
```

### 2. Get Available Slots

**Endpoint:** `GET /api/slots/available`

**Description:** Retrieves available time slots for a specific Cal.com event type.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventTypeId` | string | Yes | Cal.com event type ID |
| `start` | string | No | Start date (ISO 8601 format) |
| `end` | string | No | End date (ISO 8601 format) |
| `timezone` | string | No | Timezone (e.g., "America/New_York") |

**Response:**

```json
{
  "slots": [
    {
      "start": "2025-09-01T10:00:00Z",
      "end": "2025-09-01T10:30:00Z",
      "available": true
    },
    {
      "start": "2025-09-01T11:00:00Z",
      "end": "2025-09-01T11:30:00Z",
      "available": false
    }
  ],
  "eventTypeId": "3139331",
  "dateRange": {
    "start": "2025-09-01T00:00:00Z",
    "end": "2025-09-07T23:59:59Z"
  }
}
```

**Example:**

```bash
# Basic request
curl "http://localhost:3000/api/slots/available?eventTypeId=3139331"

# With date range
curl "http://localhost:3000/api/slots/available?eventTypeId=3139331&start=2025-09-01T00:00:00Z&end=2025-09-07T23:59:59Z"

# With timezone
curl "http://localhost:3000/api/slots/available?eventTypeId=3139331&timezone=America/New_York"
```

### 3. Reserve a Slot

**Endpoint:** `POST /api/slots/reserve`

**Description:** Reserves a time slot for an event.

**Request Body:**

```json
{
  "eventTypeId": "3139331",
  "start": "2025-09-01T10:00:00Z",
  "end": "2025-09-01T10:30:00Z",
  "attendee": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "timezone": "America/New_York"
  },
  "metadata": {
    "location": "Zoom",
    "notes": "Looking forward to our meeting"
  }
}
```

**Response:**

```json
{
  "reservationId": "abc123def456",
  "status": "confirmed",
  "eventDetails": {
    "start": "2025-09-01T10:00:00Z",
    "end": "2025-09-01T10:30:00Z",
    "eventTypeId": "3139331"
  },
  "attendee": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/slots/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypeId": "3139331",
    "start": "2025-09-01T10:00:00Z",
    "end": "2025-09-01T10:30:00Z",
    "attendee": {
      "name": "John Doe",
      "email": "john.doe@example.com"
    }
  }'
```

### 4. Update a Reservation

**Endpoint:** `PUT /api/slots/:reservationId`

**Description:** Updates an existing reservation.

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `reservationId` | string | Yes | The reservation ID to update |

**Request Body (all fields optional):**

```json
{
  "start": "2025-09-01T11:00:00Z",
  "end": "2025-09-01T11:30:00Z",
  "attendee": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  },
  "metadata": {
    "location": "In-person",
    "notes": "Updated meeting details"
  }
}
```

**Response:**

```json
{
  "reservationId": "abc123def456",
  "status": "confirmed",
  "eventDetails": {
    "start": "2025-09-01T11:00:00Z",
    "end": "2025-09-01T11:30:00Z",
    "eventTypeId": "3139331"
  },
  "attendee": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  }
}
```

**Example:**

```bash
curl -X PUT http://localhost:3000/api/slots/abc123def456 \
  -H "Content-Type: application/json" \
  -d '{
    "start": "2025-09-01T11:00:00Z",
    "end": "2025-09-01T11:30:00Z",
    "attendee": {
      "name": "Jane Doe"
    }
  }'
```

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details",
    "timestamp": "2025-08-31T01:37:46.800Z"
  }
}
```

### Common Error Codes

| Code                    | HTTP Status | Description                           |
| ----------------------- | ----------- | ------------------------------------- |
| `VALIDATION_ERROR`      | 400         | Invalid request parameters            |
| `AUTHENTICATION_ERROR`  | 401         | Cal.com API authentication failed     |
| `RESERVATION_NOT_FOUND` | 404         | Reservation not found                 |
| `EVENT_TYPE_NOT_FOUND`  | 404         | Event type not found                  |
| `SLOT_UNAVAILABLE`      | 409         | Requested slot is no longer available |
| `UPDATE_CONFLICT`       | 409         | Update conflict occurred              |
| `INTERNAL_SERVER_ERROR` | 500         | Server error                          |

### Example Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "msg": "Event type ID is required",
        "param": "eventTypeId",
        "location": "query"
      }
    ],
    "timestamp": "2025-08-31T01:37:46.800Z"
  }
}
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern="slots"

# Run tests with coverage
npm run test:coverage
```

### Manual Testing with curl

1. **Test health endpoint:**

   ```bash
   curl http://localhost:3000/health
   ```

2. **Test date endpoint:**

   ```bash
   curl http://localhost:3000/api/date
   ```

3. **Test available slots (replace with your event type ID):**
   ```bash
   curl "http://localhost:3000/api/slots/available?eventTypeId=YOUR_EVENT_TYPE_ID"
   ```

## Examples

### Complete Workflow Example

1. **Get available slots:**

   ```bash
   curl "http://localhost:3000/api/slots/available?eventTypeId=3139331&start=2025-09-01T00:00:00Z&end=2025-09-07T23:59:59Z"
   ```

2. **Reserve a slot:**

   ```bash
   curl -X POST http://localhost:3000/api/slots/reserve \
     -H "Content-Type: application/json" \
     -d '{
       "eventTypeId": "3139331",
       "start": "2025-09-01T10:00:00Z",
       "end": "2025-09-01T10:30:00Z",
       "attendee": {
         "name": "John Doe",
         "email": "john.doe@example.com"
       }
     }'
   ```

3. **Update the reservation (use the reservationId from step 2):**
   ```bash
   curl -X PUT http://localhost:3000/api/slots/RESERVATION_ID \
     -H "Content-Type: application/json" \
     -d '{
       "attendee": {
         "name": "Jane Doe"
       }
     }'
   ```

### JavaScript/Node.js Example

```javascript
const axios = require("axios");

const API_BASE = "http://localhost:3000/api";

// Get available slots
async function getAvailableSlots(eventTypeId) {
  try {
    const response = await axios.get(`${API_BASE}/slots/available`, {
      params: {
        eventTypeId,
        start: "2025-09-01T00:00:00Z",
        end: "2025-09-07T23:59:59Z",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error getting slots:",
      error.response?.data || error.message
    );
  }
}

// Reserve a slot
async function reserveSlot(eventTypeId, start, end, attendee) {
  try {
    const response = await axios.post(`${API_BASE}/slots/reserve`, {
      eventTypeId,
      start,
      end,
      attendee,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error reserving slot:",
      error.response?.data || error.message
    );
  }
}

// Usage
(async () => {
  const slots = await getAvailableSlots("3139331");
  console.log("Available slots:", slots);

  if (slots?.slots?.length > 0) {
    const firstSlot = slots.slots[0];
    const reservation = await reserveSlot(
      "3139331",
      firstSlot.start,
      firstSlot.end,
      {
        name: "John Doe",
        email: "john.doe@example.com",
      }
    );
    console.log("Reservation:", reservation);
  }
})();
```

## Troubleshooting

### Common Issues

1. **"Cal.com API authentication failed"**

   - Check your `CALCOM_API_KEY` in `.env`
   - Ensure the API key is valid and has proper permissions

2. **"Event type not found"**

   - Verify the `eventTypeId` exists in your Cal.com account
   - Check that the event type is active and published

3. **"Network error"**

   - Check your internet connection
   - Verify `CALCOM_BASE_URL` is correct

4. **Server won't start**
   - Check if port 3000 is already in use
   - Verify all environment variables are set
   - Run `npm run build` before `npm start`

### Logs

The application logs all requests and responses. Check the console output for detailed information about API calls and errors.

### Support

For issues related to:

- **Cal.com API**: Check [Cal.com API documentation](https://cal.com/docs/api)
- **This application**: Check the logs and error messages for troubleshooting
