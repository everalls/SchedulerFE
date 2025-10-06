import React, { createContext, useContext, useState, useCallback } from 'react';
import { Appointment, BackendCalendarEvent } from '../types';
import { getMockAppointments } from '../mock/mockAppointments';
import { fetchEvents, FetchEventsParams } from '../services/api';
import { backendToAppointment } from '../transformers';

interface AppointmentsContextValue {
  appointments: Appointment[];
  addAppointment: (appt: Appointment) => void;
  deleteAppointment: (id: string) => void;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  // API integration
  isLoading: boolean;
  error: string | null;
  fetchAppointments: (params: FetchEventsParams) => Promise<void>;
  clearError: () => void;
}

const AppointmentsContext = createContext<AppointmentsContextValue | undefined>(
  undefined
);

export const AppointmentsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (params: FetchEventsParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchEvents(params);
      
      if (response.success) {
        const transformedAppointments = response.events.map(backendToAppointment);
        setAppointments(transformedAppointments);
        console.log(`Fetched ${transformedAppointments.length} appointments from API`);
      } else {
        setError(response.error || 'Failed to fetch appointments');
        console.error('API Error:', response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const addAppointment = (appt: Appointment) => {
    const appointmentWithId = {
      ...appt,
      id: appt.id || crypto.randomUUID(),
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
        isLoading,
        error,
        fetchAppointments,
        clearError,
      }}
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
