'use strict';

const responseService = require('./response.service');

const formatResponse = (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, message: 'Request body is required' });
    }

    const { query, intent, knowledge, recommendations } = req.body;
    if (!query || !intent) {
      return res.status(400).json({ success: false, message: 'query and intent are required' });
    }

    const formattedPayload = responseService.structureResponse(query, intent, knowledge || [], recommendations || []);
    res.status(200).json({ success: true, data: formattedPayload });
  } catch (error) {
    if (error.code === 'INVALID_COLLECTION') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const summarizeTicket = (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, message: 'Request body is required' });
    }

    const summary = responseService.summarizeTicketTimeline(req.body);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const suggestResolution = (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, message: 'Request body is required' });
    }

    const suggestions = responseService.generateResolutionSuggestions(req.body);
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  formatResponse,
  summarizeTicket,
  suggestResolution,
};
