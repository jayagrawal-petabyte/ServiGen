// Implementation Summary: Controller for AI Intent Analysis, handling incoming requests and returning standard JSON responses.
const { classifyIntent } = require('./intent.service');

//Controller to handle intent analysis requests. This is the entry point for AI Core intent evaluation.

const analyzeIntent = async (req, res) => {
  try {
    // Here I pass the request payload to the service, keeping the controller isolated from the mock logic underneath.
    const result = await classifyIntent(req.body);

    // Respond with success and the intent data
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Respond with 400 Bad Request if validation fails
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  analyzeIntent,
};
