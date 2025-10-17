import { BackendCalendarEvent } from '../types';

// Assume calendarId is constant 2 for now, but preserve payload fields
export const mockBackendEvents: BackendCalendarEvent[] = [
  {
    description: '',
    starting: '2025-10-02T06:00:00-02:00',
    ending: '2025-10-02T11:00:00-02:00',
    services: [{ description: 'Manicure', calendarId: 2, id: 1, name: 'Mani' }],
    locations: [
      {
        isLocked: false,
        description: 'Facial/Massage/Wax room for 1',
        maxCapacity: 1,
        availableServices: [
          { description: 'Facial', id: 3, name: 'Facial' },
          { description: 'Massage', id: 4, name: 'Massage' },
          { description: 'Wax', id: 5, name: 'Wax' },
        ],
        absences: [
          {
            absenceTimeRange: {
              start: '2024-01-01T00:00:00+00:00',
              end: '2024-02-01T00:00:00+00:00',
            },
            reason: 'Renovations',
          },
        ],
        calendarId: 2,
        id: 1,
        name: 'Room #1',
      },
    ],
    workers: [
      {
        isLocked: false,
        description: 'Elsa worker',
        availableServices: [
          { description: 'Manicure', id: 1, name: 'Mani' },
          { description: 'Pedicure', id: 2, name: 'Pedi' },
          { description: 'Facial', id: 3, name: 'Facial' },
          { description: 'Massage', id: 4, name: 'Massage' },
          { description: 'Wax', id: 5, name: 'Wax' },
        ],
        absences: [],
        customData: '{"Data":""}',
        preferrableResources: [{ resourceId: 1, onServicesIds: [1] }],
        calendarId: 2,
        id: 5,
        name: 'Elsa',
      },
    ],
    clients: [
      {
        description: 'Alex customer',
        preferrableResources: [],
        calendarId: 2,
        id: 7,
        name: 'Alex',
      },
    ],
    isLocked: false,
    calendarId: 2,
    id: 5,
    name: 'Booking Alex 1',
  },
];
