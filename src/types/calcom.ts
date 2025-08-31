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
  responses: {
    name: string;
    email: string;
    location?: string;
    notes?: string;
  };
  timeZone?: string;
  language?: string;
  metadata?: Record<string, any>;
}

export interface CalComReservationResponse {
  uid: string;
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: CalComAttendee[];
  organizer: CalComOrganizer;
  status: string;
  location?: string;
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
