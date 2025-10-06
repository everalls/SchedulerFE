import { Appointment, BackendCalendarEvent } from './types';

// Choose first entries as primary; fall back to blanks when absent
export const backendToAppointment = (be: BackendCalendarEvent): Appointment => {
  const clientName = be.clients?.[0]?.name ?? '';
  const service = be.services?.[0]?.name ?? '';
  const provider = be.workers?.[0]?.name ?? '';
  const room = be.locations?.[0]?.name ?? '';

  return {
    id: String(be.id),
    clientName,
    service,
    provider,
    room,
    // Preserve the backend timezone offsets; store as received
    startTime: be.starting,
    endTime: be.ending,
  };
};

// Thin view-model for FullCalendar (avoid global type)
export const appointmentToCalendarEvent = (appointment: Appointment) => ({
  id: appointment.id,
  title: `${appointment.clientName} - ${appointment.service}`.trim() || 'Event',
  start: appointment.startTime,
  end: appointment.endTime,
  extendedProps: {
    clientName: appointment.clientName,
    provider: appointment.provider,
    room: appointment.room,
    service: appointment.service,
  },
});

export const backendToCalendarEvent = (be: BackendCalendarEvent) =>
  appointmentToCalendarEvent(backendToAppointment(be));
