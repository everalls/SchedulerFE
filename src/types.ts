export type Appointment = {
  id: string;
  clientName: string;
  service: string;
  provider: string;
  room: string;

  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    clientName: string;
    provider: string;
    room: string;
    service: string; // Added service property
  };
};
