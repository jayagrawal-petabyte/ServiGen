const {
  searchKnowledge,
  getKnowledge,
} = require('./retrieval.service');

/**
 * Standard error responder for retrieval endpoints.
 */
const respondWithError = (res, error, fallbackMessage) => {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : fallbackMessage,
  });
};

/**
 * GET /ai-core/retrieval/search
 *
 * Search organisational knowledge using a query.
 */
const searchKnowledgeHandler = async (req, res) => {
  try {
    const {
      organisationId,
      query,
      limit,
    } = req.query;

    const parsedLimit =
      limit === undefined
        ? 5
        : Number(limit);

    const results = await searchKnowledge(
      organisationId,
      query,
      parsedLimit
    );

    return res.status(200).json({
      success: true,
      message: 'Knowledge retrieved successfully',
      data: results,
    });
  } catch (error) {
    return respondWithError(
      res,
      error,
      'Failed to retrieve knowledge'
    );
  }
};

/**
 * GET /ai-core/retrieval/:documentId
 *
 * Get a specific knowledge document.
 */
const getKnowledgeHandler = async (req, res) => {
  try {
    const {
      organisationId,
    } = req.query;

    const {
      documentId,
    } = req.params;

    const document = await getKnowledge(
      organisationId,
      documentId
    );

    return res.status(200).json({
      success: true,
      message: 'Knowledge document loaded successfully',
      data: document,
    });
  } catch (error) {
    return respondWithError(
      res,
      error,
      'Failed to load knowledge document'
    );
  }
};

module.exports = {
  searchKnowledgeHandler,
  getKnowledgeHandler,
};