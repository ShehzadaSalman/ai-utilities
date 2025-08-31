# Design Document

## Overview

The Calendar API Integration application is an Express.js REST API that serves as a middleware layer between client applications and Cal.com's API. The application provides a simplified interface for calendar operations while handling authentication, error management, and data transformation. The architecture follows RESTful principles with clear separation of concerns through controllers, services, and middleware layers.

## Architecture

The application follows a layered architecture pattern:

```
┌─────────────────┐
│   Client Apps   │
└─────────────────┘
         │
┌─────────────────┐
│  Express Routes │
└─────────────────┘
         │
┌─────────────────┐
│   Controllers   │
└─────────────────┘
         │
┌─────────────────┐
│    Services     │
└─────────────────┘
         │
┌─────────────────┐
│   Cal.com API   │
└─────────────────┘
```

### Key Architectural Decisions

1. **Middleware Layer**: Acts as a proxy to Cal.com API, providing consistent error handling and response formatting
2. **Service Layer**: Encapsulates Cal.com API interactions and business logic
3. **Controller Layer**: Handles HTTP request/response logic and validation
4. **Configuration Management**: Centralized configuration for API credentials and endpoints

## Components and Interfaces

### 1. Express Application Setup

- **Purpose**: Main application entry point with middleware configuration
- **Responsibilities**: Server initialization, middleware registration, route mounting
- **Dependencies**: Express.js, cors, helmet, morgan for logging

### 2. Route Handlers

- **Date Route**: `GET /api/date` - Returns current date
- **Available Slots Route**: `GET /api/slots/available` - Retrieves available time slots
- **Reserve Slot Route**: `POST /api/slots/reserve` - Creates new reservation
- **Update Slot Route**: `PUT /api/slots/:reservationId` - Updates existing reservation

### 3. Controllers

```typescript
interface DateController {
  getCurrentDate(): Promise<DateResponse>;
}

interface SlotsController {
  getAvailableSlots(
    eventTypeId: string,
    dateRange: DateRange
  ): Promise<SlotsResponse>;
  reserveSlot(
    reservationData: ReservationRequest
  ): Promise<ReservationResponse>;
  updateSlot(
    reservationId: string,
    updateData: UpdateRequest
  ): Promise<ReservationResponse>;
}
```

### 4. Services

```typescript
interface CalComService {
  getAvailableSlots(params: AvailableSlotsParams): Promise<CalComSlotsResponse>;
  reserveSlot(data: CalComReservationData): Promise<CalComReservationResponse>;
  updateReservation(
    id: string,
    data: CalComUpdateData
  ): Promise<CalComReservationResponse>;
}

interface DateService {
  getCurrentDate(): Date;
  formatDate(date: Date): string;
}
```

### 5. Middleware Components

- **Authentication Middleware**: Validates Cal.com API credentials
- **Error Handler**: Centralized error processing and response formatting
- **Request Validator**: Input validation using express-validator
- **Rate Limiter**: Prevents API abuse and manages Cal.com rate limits

## Data Models

### Request/Response Models

```typescript
// Date endpoint
interface DateResponse {
  currentDate: string; // ISO 8601 format
  timestamp: number;
}

// Available slots
interface AvailableSlotsParams {
  eventTypeId: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface SlotsResponse {
  slots: TimeSlot[];
  eventTypeId: string;
  dateRange: {
    start: string;
    end: string;
  };
}

// Reservation models
interface ReservationRequest {
  eventTypeId: string;
  start: string;
  end: string;
  attendee: {
    name: string;
    email: string;
    timezone?: string;
  };
  metadata?: Record<string, any>;
}

interface ReservationResponse {
  reservationId: string;
  status: "confirmed" | "pending" | "cancelled";
  eventDetails: {
    start: string;
    end: string;
    eventTypeId: string;
  };
  attendee: {
    name: string;
    email: string;
  };
}

// Update models
interface UpdateRequest {
  start?: string;
  end?: string;
  attendee?: {
    name?: string;
    email?: string;
  };
  metadata?: Record<string, any>;
}
```

### Configuration Model

```typescript
interface AppConfig {
  port: number;
  calcom: {
    apiKey: string;
    baseUrl: string;
    version: string;
  };
  logging: {
    level: string;
    format: string;
  };
}
```

## Error Handling

### Error Categories

1. **Validation Errors** (400): Invalid request parameters or missing required fields
2. **Authentication Errors** (401): Invalid or missing Cal.com API credentials
3. **Not Found Errors** (404): Reservation or resource not found
4. **Conflict Errors** (409): Slot no longer available or scheduling conflicts
5. **External API Errors** (502): Cal.com API failures or timeouts
6. **Rate Limit Errors** (429): API rate limit exceeded

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}
```

### Error Handling Strategy

- **Graceful Degradation**: Return meaningful errors when Cal.com API is unavailable
- **Retry Logic**: Implement exponential backoff for transient failures
- **Circuit Breaker**: Prevent cascading failures when external API is down
- **Logging**: Comprehensive error logging with correlation IDs

## Testing Strategy

### Unit Testing

- **Controllers**: Test request/response handling and validation
- **Services**: Test Cal.com API integration and data transformation
- **Middleware**: Test authentication, validation, and error handling
- **Utilities**: Test date formatting and helper functions

### Integration Testing

- **API Endpoints**: Test complete request/response cycles
- **Cal.com Integration**: Test actual API calls with mock responses
- **Error Scenarios**: Test various failure conditions and error responses

### Testing Tools

- **Jest**: Primary testing framework
- **Supertest**: HTTP endpoint testing
- **Nock**: HTTP mocking for Cal.com API calls
- **Test Coverage**: Minimum 80% code coverage requirement

### Test Environment Setup

- **Mock Cal.com API**: Use nock to simulate Cal.com responses
- **Test Database**: In-memory or test-specific database for any local data
- **Environment Variables**: Separate test configuration
- **CI/CD Integration**: Automated testing in build pipeline
