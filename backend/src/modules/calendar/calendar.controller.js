'use strict';

const calendarModel = require('./calendar.model');

const listEvents = async (req, res, next) => {
  try {
    const agentId = req.user.role === 'Admin' ? req.query.agentId : req.user.id;
    const events = await calendarModel.getCalendarEvents(agentId);
    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (err) {
    next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { title, appointmentType, startsAt, endsAt } = req.body || {};
    if (!title || !startsAt || !endsAt) {
      return res.status(400).json({
        success: false,
        message: 'title, startsAt, and endsAt are required',
      });
    }
    const created = await calendarModel.createCalendarEvent({
      title,
      appointmentType: appointmentType || 'Appointment',
      startsAt,
      endsAt,
      agentId: req.user.id,
    });
    return res.status(201).json({
      success: true,
      data: created,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listEvents,
  createEvent,
};
