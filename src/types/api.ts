// Date endpoint types
export interface DateResponse {
  currentDate: string; // ISO 8601 format
  timestamp: number;
  timezone?: string; // Timezone used for formatting
  utcDate: string; // Always include UTC for reference
}

// Available slots types
export interface AvailableSlotsParams {
  eventTypeId: string;
  start?: string;
  end?: string;
  timezone?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface SlotsResponse {
  slots: TimeSlot[];
  eventTypeId: string;
  dateRange: {
    start: string;
    end: string;
  };
}

// Reservation types
export interface ReservationRequest {
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

export interface ReservationResponse {
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

// Update types
export interface UpdateRequest {
  start?: string;
  end?: string;
  attendee?: {
    name?: string;
    email?: string;
  };
  metadata?: Record<string, any>;
}

// Error response type
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}
