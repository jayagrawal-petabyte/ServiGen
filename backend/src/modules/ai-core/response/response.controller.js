const responseService = require('./response.service');

const formatResponse = (req, res) => {
  try {
    // CR: Guard req.body before destructuring — a missing body (no Content-Type header)
    //     would otherwise throw a TypeError and surface as a 500.
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
    // BI-11: invalid collection type or entry shape returns 400
    if (error.code === 'INVALID_COLLECTION') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  formatResponse
};
