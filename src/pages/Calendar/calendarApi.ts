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
