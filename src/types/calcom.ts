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
  slotStart: string;
}

export interface CalComReservationResponse {
  status: string;
  data: {
    eventTypeId: number;
    slotStart: string;
    slotEnd: string;
    slotDuration: number;
    reservationUid: string;
    reservationDuration: number;
    reservationUntil: string;
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
