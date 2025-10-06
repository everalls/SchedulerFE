import { BackendCalendarEvent } from '../types';

// Use proxy in development, CORS proxy for GitHub Pages
// Check if we're running on localhost (development) or deployed (production)
const isDevelopment =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment
  ? '/api' // Proxy through Vite dev server (fixes CORS in development)
  : 'https://api.allorigins.win/raw?url=' +
    encodeURIComponent(
      'https://schedule-spa-api-c7bmhvb4b0fgcrc9.canadacentral-01.azurewebsites.net/api'
    ); // CORS proxy for GitHub Pages
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
    const fromFormatted = new Date(from).toISOString().slice(0, 16);
    const toFormatted = new Date(to).toISOString().slice(0, 16);

    const url = `${API_BASE_URL}/booking?from=${fromFormatted}&to=${toFormatted}&calendarId=${CALENDAR_ID}`;

    console.log('Fetching events from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any authentication headers here when auth is implemented
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

  // Add some buffer to ensure we get all events
  const bufferStart = new Date(start);
  bufferStart.setDate(bufferStart.getDate() - 1);

  const bufferEnd = new Date(end);
  bufferEnd.setDate(bufferEnd.getDate() + 1);

  return formatDateRange(bufferStart, bufferEnd);
};
