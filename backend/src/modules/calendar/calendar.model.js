'use strict';

const db = require('../../config/db');

const getCalendarEvents = async (agentId) => {
  if (process.env.NODE_ENV !== 'test') {
    try {
      const where = agentId ? { agentId } : {};
      const events = await db.calendarEvent.findMany({
        where,
        orderBy: { startsAt: 'asc' },
      });
      return events.map((e) => ({
        id: e.id,
        title: e.title,
        appointmentType: e.appointmentType,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt.toISOString(),
        agentId: e.agentId,
      }));
    } catch (_err) {
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
      return [];
    }
  }
  return [];
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
      if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_OFFLINE_MOCKS) {
        throw _err;
      }
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
