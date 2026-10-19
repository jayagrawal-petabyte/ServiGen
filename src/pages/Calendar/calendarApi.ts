const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function getCalendarEvents() {
  const res = await fetch(`${BASE_URL}/api/calendar`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch calendar events');
  return res.json();
}

export async function createCalendarEvent(data: {
  title: string;
  appointmentType: string;
  startsAt: string;
  endsAt: string;
}) {
  const res = await fetch(`${BASE_URL}/api/calendar`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create calendar event');
  return res.json();
}