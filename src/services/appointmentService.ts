import { Appointment } from '../types/types';

export const getMockAppointments = (): Appointment[] => [
  {
    id: '1',
    clientName: 'Jane Doe',
    service: 'Massage',
    provider: 'John',
    room: 'Room 1',
    time: '2025-09-15T10:00:00',
  },
  {
    id: '2',
    clientName: 'Mark Smith',
    service: 'Physiotherapy',
    provider: 'Anna',
    room: 'Room 2',
    time: '2025-09-15T11:30:00',
  },
];
