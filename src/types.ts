export type Appointment = {
  id: string;
  clientName: string;
  service: string;
  provider: string;
  room: string;
  // IDs for API integration
  clientId?: number;
  serviceId?: number;
  providerId?: number;
  roomId?: number;

  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
};

// Backend model (aligns with API contract)
export interface BackendServiceRef {
  description: string;
  id: number;
  name: string;
  calendarId?: number;
}

export interface BackendAbsence {
  absenceTimeRange: { start: string; end: string };
  reason: string;
}

export interface BackendLocation {
  description: string;
  maxCapacity: number;
  availableServices: BackendServiceRef[];
  customData: string;
  calendarId: number;
  id: number;
  name: string;
}

export interface BackendPreferrableResource {
  resourceId: number;
  onServicesIds: number[];
}

export interface BackendWorker {
  description: string;
  availableServices: BackendServiceRef[];
  customData: string;
  calendarId: number;
  id: number;
  name: string;
}

export interface BackendClient {
  description: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  email: string;
  customData: string;
  preferrableResources: any;
  calendarId: number;
  id: number;
  name: string;
}

export interface BackendService {
  description: string;
  calendarId: number;
  id: number;
  name: string;
}

export interface BackendCalendarEvent {
  description: string;
  starting: string; // e.g. 2025-07-16T06:00:00-04:00
  ending: string; // e.g. 2025-07-16T11:00:00-04:00
  services: BackendServiceRef[];
  locations: BackendLocation[];
  workers: BackendWorker[];
  clients: BackendClient[];
  isLocked: boolean;
  calendarId: number; // assume const 2 for now
  id: number;
  name: string; // booking name
}

// Booking API request types
export interface BookingResourceRef {
  id: number;
  IsLocked: boolean;
}

export interface CreateBookingRequest {
  calendarId: number;
  name: string;
  description: string;
  starting: string;
  ending: string;
  locations: BookingResourceRef[];
  workers: BookingResourceRef[];
  clients: BookingResourceRef[];
  servicesIds: number[];
  isLocked: boolean;
}

export interface UpdateBookingRequest extends CreateBookingRequest {
  id: number;
}
