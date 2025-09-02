# Simple Calendar API

A minimal Express.js API for Cal.com calendar integration.

## Features

- Get current date
- Retrieve available time slots from Cal.com
- Reserve time slots
- Update existing reservations

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Add your Cal.com API key to `.env`

4. Start the server:

```bash
npm start
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/date` - Get current date
- `GET /api/slots/available?eventTypeId=123` - Get available slots
- `POST /api/slots/reserve` - Reserve a slot
- `PUT /api/slots/:reservationId` - Update a reservation
- `GET /api/test-calcom` - Test Cal.com connection

## Environment Variables

```
PORT=3000
CALCOM_API_KEY=your_api_key_here
CALCOM_BASE_URL=https://api.cal.com/v2
```
