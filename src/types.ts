export type Appointment = {
  id: string;
  clientName: string;
  service: string;
  provider: string;
  room: string;

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
  isLocked: boolean;
  description: string;
  maxCapacity: number;
  availableServices: BackendServiceRef[];
  absences: BackendAbsence[];
  calendarId: number;
  id: number;
  name: string;
}

export interface BackendPreferrableResource {
  resourceId: number;
  onServicesIds: number[];
}

export interface BackendWorker {
  isLocked: boolean;
  description: string;
  availableServices: BackendServiceRef[];
  absences: BackendAbsence[];
  customData?: string;
  preferrableResources: BackendPreferrableResource[];
  calendarId: number;
  id: number;
  name: string;
}

export interface BackendClient {
  description: string;
  preferrableResources: BackendPreferrableResource[];
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
