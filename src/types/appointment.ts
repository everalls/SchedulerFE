export interface Appointment {
  id: string;
  clientName: string;
  service: string;
  provider: string;
  room: string;

  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
}
