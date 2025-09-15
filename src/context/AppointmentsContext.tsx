import React, { createContext, useContext, useState } from 'react';
import { Appointment } from '../types/types';
import { getMockAppointments } from '../services/appointmentService';

interface AppointmentsContextValue {
  appointments: Appointment[];
  addAppointment: (appt: Appointment) => void;
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
    setAppointments((prev) => [...prev, appt]);
  };

  return (
    <AppointmentsContext.Provider value={{ appointments, addAppointment }}>
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
