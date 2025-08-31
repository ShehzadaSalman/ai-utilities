# Calendar API Integration

Express.js API for Cal.com calendar integration providing endpoints for date utilities, available time slots, slot reservations, and slot updates.

## Features

- Get current date
- Retrieve available time slots from Cal.com
- Reserve time slots
- Update existing reservations
- Comprehensive error handling
- Request validation
- Structured logging

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Configure your Cal.com API credentials in `.env`

4. Build the project:

```bash
npm run build
```

5. Start the server:

```bash
npm start
```

For development:

```bash
npm run dev
```

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## API Endpoints

- `GET /api/date` - Get current date
- `GET /api/slots/available` - Get available time slots
- `POST /api/slots/reserve` - Reserve a time slot
- `PUT /api/slots/:reservationId` - Update a reservation

## Environment Variables

See `.env.example` for required configuration.
