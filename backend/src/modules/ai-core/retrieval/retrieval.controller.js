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

    // SG-05 / BI-20: Non-admin users cannot query another organisation's knowledge
    const targetOrgId = (req.user && req.user.role !== 'Admin' && req.user.organisationId)
      ? req.user.organisationId
      : (organisationId || req.user?.organisationId);

    const rawLimit = limit === undefined ? 5 : Number(limit);
    const parsedLimit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 5 : rawLimit));

    const results = await searchKnowledge(
      targetOrgId,
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

    // SG-05 / BI-20: Non-admin users cannot access another organisation's knowledge
    const targetOrgId = (req.user && req.user.role !== 'Admin' && req.user.organisationId)
      ? req.user.organisationId
      : (organisationId || req.user?.organisationId);

    const document = await getKnowledge(
      targetOrgId,
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