import { Appointment } from '../types';
import { mockBackendEvents } from './mockBackendEvents';
import { backendToAppointment } from '../transformers';

export const getMockAppointments = (): Appointment[] =>
  mockBackendEvents.map(backendToAppointment);
