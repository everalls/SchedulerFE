import { Appointment } from '../types';

export const getMockAppointments = (): Appointment[] => [
  {
    id: '1',
    clientName: 'Jane Doe',
    service: 'Massage',
    provider: 'John',
    room: 'Room 1',
    startTime: '2025-09-15T10:00:00',
    endTime: '2025-09-15T10:30:00',
  },
  {
    id: '2',
    clientName: 'Mark Smith',
    service: 'Physiotherapy',
    provider: 'Anna',
    room: 'Room 2',
    startTime: '2025-09-15T11:30:00',
    endTime: '2025-09-15T12:00:00',
  },
];
