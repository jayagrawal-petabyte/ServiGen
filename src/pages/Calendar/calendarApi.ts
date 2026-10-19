/**
 * Calendar API.
 *
 * Routed through the shared apiClient rather than a bare fetch(). The previous
 * standalone implementation broke in two ways that only showed up on Vercel:
 *
 *   - `BASE_URL` fell back to 'http://localhost:5000' whenever
 *     VITE_API_BASE_URL was unset. On a deployed HTTPS page that request is
 *     blocked as mixed content and the browser never reaches the backend.
 *   - it read the JWT from localStorage['token'] directly, so it missed the
 *     canonical key and sent `Bearer null`.
 *
 * apiClient resolves the base URL correctly in every environment (dev proxy,
 * VITE_API_BASE_URL, or the production default), attaches the current token,
 * and surfaces real status codes instead of a generic Error.
 */

import { api } from '../../services/apiClient';

export interface CalendarEvent {
  id: string;
  title: string;
  appointmentType: string;
  startsAt: string;
  endsAt: string;
  agentId?: string;
}

export interface CreateCalendarEventPayload {
  title: string;
  appointmentType: string;
  startsAt: string;
  endsAt: string;
}

function unwrap<T>(response: any): T {
  return (response?.data ?? response) as T;
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await api.get('/api/calendar');
  const events = unwrap<CalendarEvent[]>(response);
  return Array.isArray(events) ? events : [];
}

export async function createCalendarEvent(
  data: CreateCalendarEventPayload
): Promise<CalendarEvent> {
  const response = await api.post('/api/calendar', data);
  return unwrap<CalendarEvent>(response);
}
