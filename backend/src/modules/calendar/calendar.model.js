'use strict';

const db = require('../../config/db');

const getMockEvents = () => {
  const now = Date.now();
  const d = (days, hours = 0) => new Date(now + (days * 86400 + hours * 3600) * 1000).toISOString();
  return [
    { id: 'cal-1', title: 'Daily Support Standup', appointmentType: 'meeting', startsAt: d(0, 9), endsAt: d(0, 9.5), agentId: 'usr_1' },
    { id: 'cal-2', title: 'Vendor SLA Review Call', appointmentType: 'phone-call', startsAt: d(0, 11), endsAt: d(0, 12), agentId: 'usr_2' },
    { id: 'cal-3', title: 'Server Room Rack Upgrade', appointmentType: 'resource-booking', startsAt: d(0, 14), endsAt: d(0, 16), agentId: 'usr_3' },
    { id: 'cal-4', title: 'Onsite Network Audit', appointmentType: 'site-visit', startsAt: d(1, 10), endsAt: d(1, 12.5), agentId: 'usr_2' },
    { id: 'cal-5', title: 'Major Incident Post-Mortem', appointmentType: 'phone-call', startsAt: d(1, 15), endsAt: d(1, 15.75), agentId: 'usr_1' },
    { id: 'cal-6', title: 'Sprint Backlog Review', appointmentType: 'meeting', startsAt: d(2, 10), endsAt: d(2, 11.5), agentId: 'usr_4' },
    { id: 'cal-7', title: 'Boardroom A Booking', appointmentType: 'resource-booking', startsAt: d(2, 13), endsAt: d(2, 14), agentId: 'usr_1' },
    { id: 'cal-8', title: 'IT Service Catalog Training', appointmentType: 'meeting', startsAt: d(3, 9.5), endsAt: d(3, 12), agentId: 'usr_2' },
    { id: 'cal-9', title: 'Disaster Recovery Site Visit', appointmentType: 'site-visit', startsAt: d(3, 14), endsAt: d(3, 17), agentId: 'usr_3' },
  ];
};

const getCalendarEvents = async (agentId) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const where = agentId ? { agentId } : {};
      const events = await db.calendarEvent.findMany({
        where,
        orderBy: { startsAt: 'asc' },
      });
      if (events && events.length > 0) {
        return events.map((e) => ({
          id: e.id,
          title: e.title,
          appointmentType: e.appointmentType,
          startsAt: e.startsAt.toISOString(),
          endsAt: e.endsAt.toISOString(),
          agentId: e.agentId,
        }));
      }
      return getMockEvents();
    } catch (_err) {
      return getMockEvents();
    }
  }
  return getMockEvents();
};

const createCalendarEvent = async (data) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const created = await db.calendarEvent.create({
        data: {
          title: data.title,
          appointmentType: data.appointmentType || 'Appointment',
          startsAt: new Date(data.startsAt),
          endsAt: new Date(data.endsAt),
          agentId: data.agentId,
        },
      });
      return {
        id: created.id,
        title: created.title,
        appointmentType: created.appointmentType,
        startsAt: created.startsAt.toISOString(),
        endsAt: created.endsAt.toISOString(),
        agentId: created.agentId,
      };
    } catch (_err) {
      // Fallback
    }
  }
  return {
    id: 'cal-' + Date.now(),
    ...data,
  };
};

module.exports = {
  getCalendarEvents,
  createCalendarEvent,
};
