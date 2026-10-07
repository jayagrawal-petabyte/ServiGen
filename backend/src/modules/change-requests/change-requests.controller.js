const {
  getAllChangeRequests,
  getChangeRequestDetails,
  getActiveChangeRequestsData,
} = require('./change-requests.service');

const getEffectiveOrgId = (req) => {
  if (req.user && req.user.role === 'Admin' && typeof req.query.organisationId === 'string') {
    return req.query.organisationId.trim();
  }
  return req.user?.organisationId || req.headers['x-org-id'] || null;
};

const getChangeRequestsList = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const changeRequests = await getAllChangeRequests({ organisationId });
    res.status(200).json({
      success: true,
      data: changeRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch change requests',
    });
  }
};

const getActiveChangeRequestsList = async (req, res) => {
  try {
    const organisationId = getEffectiveOrgId(req);
    const activeChangeRequests = await getActiveChangeRequestsData({ organisationId });
    res.status(200).json({
      success: true,
      data: activeChangeRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active change requests',
    });
  }
};

const getChangeRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !id.trim() || id.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Invalid change request ID format',
      });
    }

    const organisationId = getEffectiveOrgId(req);
    const changeRequest = await getChangeRequestDetails(id.trim(), organisationId);

    if (!changeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Change request not found',
      });
    }

    res.status(200).json({
      success: true,
      data: changeRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch change request details',
    });
  }
};

module.exports = {
  getChangeRequestsList,
  getActiveChangeRequestsList,
  getChangeRequestById,
};