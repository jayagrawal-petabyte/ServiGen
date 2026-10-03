const responseService = require('./response.service');

const formatResponse = (req, res) => {
  try {
    const { query, intent, knowledge, recommendations } = req.body;
    if (!query || !intent) {
      return res.status(400).json({ success: false, message: 'query and intent are required' });
    }

    const formattedPayload = responseService.structureResponse(query, intent, knowledge || [], recommendations || []);
    res.status(200).json({ success: true, data: formattedPayload });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  formatResponse
};
