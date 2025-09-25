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
