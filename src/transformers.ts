import { Appointment, BackendCalendarEvent } from './types';

// Choose first entries as primary; fall back to blanks when absent
export const backendToAppointment = (be: BackendCalendarEvent): Appointment => {
  const clientName = be.clients?.[0]?.name ?? '';
  const service = be.services?.[0]?.name ?? '';
  const provider = be.workers?.[0]?.name ?? '';
  const room = be.locations?.[0]?.name ?? '';

  // Extract IDs for API integration
  const clientId = be.clients?.[0]?.id;
  const serviceId = be.services?.[0]?.id;
  const providerId = be.workers?.[0]?.id;
  const roomId = be.locations?.[0]?.id;

  return {
    id: String(be.id),
    clientName,
    service,
    provider,
    room,
    // IDs for API integration
    clientId,
    serviceId,
    providerId,
    roomId,
    // Preserve the backend timezone offsets; store as received
    startTime: be.starting,
    endTime: be.ending,
    // Pass through conflicts from backend
    conflicts: be.conflicts,
  };
};

// Thin view-model for FullCalendar (avoid global type)
export const appointmentToCalendarEvent = (
  appointment: Appointment,
  allAppointments: Appointment[] = []
) => {
  // Use backend conflicts instead of client-side logic
  const isConflicting =
    appointment.conflicts && appointment.conflicts.length > 0;

  return {
    id: appointment.id,
    title:
      `${appointment.clientName} - ${appointment.service}`.trim() || 'Event',
    start: appointment.startTime,
    end: appointment.endTime,
    editable: true,
    startEditable: true,
    durationEditable: true,
    resourceEditable: true,
    constraint: null,
    className: isConflicting ? 'fc-event-conflicting' : 'fc-event-normal',
    extendedProps: {
      clientName: appointment.clientName,
      provider: appointment.provider,
      room: appointment.room,
      service: appointment.service,
      isConflicting,
      conflicts: appointment.conflicts, // Pass conflicts to extendedProps
    },
  };
};

export const backendToCalendarEvent = (be: BackendCalendarEvent) =>
  appointmentToCalendarEvent(backendToAppointment(be));
