import React, { createContext, useContext, useState } from 'react';
import { Appointment } from '../types/appointment'; // Corrected import path
import { getMockAppointments } from '../mock/mockAppointments';

interface AppointmentsContextValue {
  appointments: Appointment[];
  addAppointment: (appt: Appointment) => void;
  deleteAppointment: (id: string) => void;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>; // Added setAppointments
}

const AppointmentsContext = createContext<AppointmentsContextValue | undefined>(
  undefined
);

export const AppointmentsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>(
    getMockAppointments()
  );

  const addAppointment = (appt: Appointment) => {
    const appointmentWithId = {
      ...appt,
      id: appt.id || crypto.randomUUID(), // Ensure a unique ID is generated if not provided
    };
    console.log('Adding appointment:', appointmentWithId);
    setAppointments((prev) => [...prev, appointmentWithId]);
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev) => prev.filter((appt) => appt.id !== id));
  };

  return (
    <AppointmentsContext.Provider
      value={{
        appointments,
        addAppointment,
        deleteAppointment,
        setAppointments,
      }} // Added setAppointments to context value
    >
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error(
      'useAppointments must be used within an AppointmentsProvider'
    );
  }
  return context;
};
