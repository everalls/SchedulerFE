import { Appointment } from './types';

export const updateAppointment = (
  appointments: Appointment[],
  id: string,
  updatedFields: Partial<Appointment>
): Appointment[] => {
  const appointmentsMap = new Map(
    appointments.map((appointment) => [appointment.id, appointment])
  );
  const appointmentToUpdate = appointmentsMap.get(id);

  if (appointmentToUpdate) {
    appointmentsMap.set(id, {
      ...appointmentToUpdate,
      ...updatedFields,
    });
  }

  return Array.from(appointmentsMap.values());
};

// Configuration for conflict colors and icons
export const CONFLICT_COLORS = {
  NORMAL: '#0277bd', // Current blue color
  CONFLICT: '#d32f2f', // Red color for conflicts
  ICON_COLOR: '#ffffff', // White color for warning icon
} as const;

// Check if two appointments have time overlap
export const hasTimeOverlap = (
  appointment1: Appointment,
  appointment2: Appointment
): boolean => {
  const start1 = new Date(appointment1.startTime).getTime();
  const end1 = new Date(appointment1.endTime).getTime();
  const start2 = new Date(appointment2.startTime).getTime();
  const end2 = new Date(appointment2.endTime).getTime();

  return start1 < end2 && start2 < end1;
};

// Check if two appointments share the same provider or room
export const hasResourceConflict = (
  appointment1: Appointment,
  appointment2: Appointment
): boolean => {
  return (
    appointment1.provider === appointment2.provider ||
    appointment1.room === appointment2.room
  );
};

// Check if an appointment has conflicts with others
export const hasConflicts = (
  appointment: Appointment,
  allAppointments: Appointment[]
): boolean => {
  return allAppointments.some((otherAppointment) => {
    if (otherAppointment.id === appointment.id) return false; // Don't compare with itself

    // Check if there's time overlap AND resource conflict
    return (
      hasTimeOverlap(appointment, otherAppointment) &&
      hasResourceConflict(appointment, otherAppointment)
    );
  });
};
