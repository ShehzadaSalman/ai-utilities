// Cal.com API specific types
export interface CalComSlotsResponse {
  data: {
    slots: Record<string, CalComSlot[]>; // Date as key, array of slots as value
  };
  status: string;
}

export interface CalComSlot {
  time: string;
  attendees?: number;
  bookingUid?: string;
}

export interface CalComReservationData {
  eventTypeId: number;
  start: string;
  attendee: {
    name: string;
    email: string;
    timeZone?: string;
    phoneNumber?: string;
    language?: string;
  };
  bookingFieldsResponses?: Record<string, any>;
  guests?: string[];
  location?: {
    type: string;
    [key: string]: any;
  };
  metadata?: Record<string, any>;
  lengthInMinutes?: number;
}

export interface CalComReservationResponse {
  status: string;
  data: {
    id: number;
    uid: string;
    eventTypeId: number;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendees: CalComAttendee[];
    organizer: CalComOrganizer;
    location?: string;
    status: "ACCEPTED" | "PENDING" | "CANCELLED";
    metadata?: Record<string, any>;
    // Legacy fields for backward compatibility
    slotStart?: string;
    slotEnd?: string;
    reservationUid?: string;
  };
}

export interface CalComAttendee {
  id: number;
  email: string;
  name: string;
  timeZone: string;
  locale?: string;
}

export interface CalComOrganizer {
  id: number;
  name: string;
  email: string;
  timeZone: string;
}

export interface CalComUpdateData {
  start?: string;
  end?: string;
  responses?: {
    name?: string;
    email?: string;
    location?: string;
    notes?: string;
  };
  timeZone?: string;
  metadata?: Record<string, any>;
}

export interface CalComErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}
