import {
  BackendCalendarEvent,
  BackendClient,
  BackendLocation,
  BackendService,
  BackendWorker,
  CreateBookingRequest,
  UpdateBookingRequest,
  Appointment,
  BackendConflict,
} from '../types';

// Use proxy in development, CORS proxy for GitHub Pages
// Check if we're running on localhost (development) or deployed (production)
const isDevelopment =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// Base URL for the API
const BACKEND_API_URL =
  'https://schedule-spa-api-c7bmhvb4b0fgcrc9.canadacentral-01.azurewebsites.net/api';

const API_BASE_URL = isDevelopment
  ? '/api' // Proxy through Vite dev server (fixes CORS in development)
  : `https://corsproxy.io/?${encodeURIComponent(BACKEND_API_URL)}`; // CORS proxy for GitHub Pages

const CALENDAR_ID = 2; // Constant for now, will come from Auth later

export interface ApiError {
  message: string;
  status?: number;
}

export interface FetchEventsParams {
  from: string; // ISO date string
  to: string; // ISO date string
}

export interface FetchEventsResponse {
  events: BackendCalendarEvent[];
  success: boolean;
  error?: string;
}

/**
 * Fetches events from the API for a given date range
 */
export const fetchEvents = async (
  params: FetchEventsParams
): Promise<FetchEventsResponse> => {
  try {
    const { from, to } = params;

    // Format dates to match API expected format (YYYY-MM-DDTHH:mm)
    // Use ISO format with timezone offset
    const fromFormatted = new Date(from).toISOString();
    const toFormatted = new Date(to).toISOString();

    const url = `${API_BASE_URL}/booking?from=${fromFormatted}&to=${toFormatted}&calendarId=${CALENDAR_ID}`;

    console.log('Fetching events from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Handle different response formats - adjust based on actual API response
    const events = Array.isArray(data)
      ? data
      : data.events || data.bookings || [];

    return {
      events,
      success: true,
    };
  } catch (error) {
    console.error('Error fetching events:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to fetch events from server';

    return {
      events: [],
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Helper function to get start of day in local timezone
 */
const getStartOfDay = (date: Date): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Helper function to get end of day in local timezone
 */
const getEndOfDay = (date: Date): Date => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Utility function to format date range for API calls
 */
export const formatDateRange = (
  startDate: Date,
  endDate: Date
): FetchEventsParams => {
  return {
    from: startDate.toISOString(),
    to: endDate.toISOString(),
  };
};

/**
 * Utility function to get date range for a calendar view
 */
export const getCalendarDateRange = (view: any): FetchEventsParams => {
  const start = view.activeStart;
  const end = view.activeEnd;

  // Get proper day boundaries without arbitrary buffer
  // For day view: get exact day start/end
  // For week view: get exact week start/end
  const rangeStart = getStartOfDay(new Date(start));

  // FullCalendar's activeEnd is the start of the next day, so we need to subtract 1ms
  // to get the actual end of the current day
  const rangeEnd = new Date(end);
  rangeEnd.setMilliseconds(rangeEnd.getMilliseconds() - 1);
  rangeEnd.setHours(23, 59, 59, 999);

  return formatDateRange(rangeStart, rangeEnd);
};

/**
 * Fetches all clients from the API
 */
export const fetchClients = async (): Promise<BackendClient[]> => {
  try {
    const url = `${API_BASE_URL}/client/all?calendarId=${CALENDAR_ID}`;
    console.log('Fetching clients from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
};

/**
 * Fetches all locations/rooms from the API
 */
export const fetchLocations = async (): Promise<BackendLocation[]> => {
  try {
    const url = `${API_BASE_URL}/location/all?calendarId=${CALENDAR_ID}`;
    console.log('Fetching locations from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};

/**
 * Fetches all services from the API
 */
export const fetchServices = async (): Promise<BackendService[]> => {
  try {
    const url = `${API_BASE_URL}/service/all?calendarId=${CALENDAR_ID}`;
    console.log('Fetching services from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

/**
 * Fetches all workers/providers from the API
 */
export const fetchWorkers = async (): Promise<BackendWorker[]> => {
  try {
    const url = `${API_BASE_URL}/worker/all?calendarId=${CALENDAR_ID}`;
    console.log('Fetching workers from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching workers:', error);
    return [];
  }
};

/**
 * Helper function to convert Appointment to CreateBookingRequest
 */
const appointmentToBookingRequest = (
  appointment: Appointment
): CreateBookingRequest => {
  // Format dates to match API expected format (YYYY-MM-DDTHH:mm:ss)
  const starting = new Date(appointment.startTime).toISOString();
  const ending = new Date(appointment.endTime).toISOString();

  return {
    calendarId: CALENDAR_ID,
    name: `${appointment.clientName} - ${appointment.service}`,
    description: appointment.service,
    starting,
    ending,
    locations: appointment.roomId
      ? [{ id: appointment.roomId, IsLocked: false }]
      : [],
    workers: appointment.providerId
      ? [{ id: appointment.providerId, IsLocked: false }]
      : [],
    clients: appointment.clientId
      ? [{ id: appointment.clientId, IsLocked: false }]
      : [],
    servicesIds: appointment.serviceId ? [appointment.serviceId] : [],
    isLocked: false,
  };
};

/**
 * Creates a new booking
 */
export const createBooking = async (
  appointment: Appointment
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    const bookingRequest = appointmentToBookingRequest(appointment);
    const url = `${API_BASE_URL}/booking`;

    console.log('Creating booking:', bookingRequest);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    // Handle empty or non-JSON responses
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    }

    console.log('Booking created successfully:', data);

    return { success: true, data };
  } catch (error) {
    console.error('Error creating booking:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create booking';
    return { success: false, error: errorMessage };
  }
};

/**
 * Deletes a booking
 */
export const deleteBooking = async (
  appointmentId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const url = `${API_BASE_URL}/booking?id=${appointmentId}&calendarId=${CALENDAR_ID}`;

    console.log('Deleting booking:', appointmentId);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    console.log('Booking deleted successfully');

    return { success: true };
  } catch (error) {
    console.error('Error deleting booking:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete booking';
    return { success: false, error: errorMessage };
  }
};

/**
 * Updates an existing booking
 */
export const updateBooking = async (
  appointment: Appointment
): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    const bookingRequest = appointmentToBookingRequest(appointment);
    const updateRequest: UpdateBookingRequest = {
      ...bookingRequest,
      id: parseInt(appointment.id),
    };

    const url = `${API_BASE_URL}/booking`;

    // API expects an array of booking objects
    const payload = [updateRequest];

    console.log('Updating booking:', payload);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    // Handle empty or non-JSON responses
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    }

    console.log('Booking updated successfully:', data);

    return { success: true, data };
  } catch (error) {
    console.error('Error updating booking:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update booking';
    return { success: false, error: errorMessage };
  }
};

/**
 * Evaluates bookings and returns conflict status
 */
export const evaluateBookings = async (
  appointments: Appointment[]
): Promise<{
  success: boolean;
  error?: string;
  conflicts?: BackendConflict[];
}> => {
  try {
    // Convert all appointments to booking requests
    const bookingRequests = appointments.map((appointment) => {
      const bookingRequest = appointmentToBookingRequest(appointment);
      const updateRequest: UpdateBookingRequest = {
        ...bookingRequest,
        id: parseInt(appointment.id),
      };
      return updateRequest;
    });

    const url = `${API_BASE_URL}/booking/evaluate?calendarId=${CALENDAR_ID}`;

    console.log('Evaluating bookings:', bookingRequests);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingRequests),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
    }

    const data = await response.json();

    console.log('Bookings evaluated successfully:', data);

    return { success: true, conflicts: data };
  } catch (error) {
    console.error('Error evaluating bookings:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to evaluate bookings';
    return { success: false, error: errorMessage };
  }
};
