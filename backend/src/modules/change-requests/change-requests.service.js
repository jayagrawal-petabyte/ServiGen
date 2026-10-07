const {
  getChangeRequests,
  getChangeRequestById,
  getActiveChangeRequests,
} = require('./change-requests.model');

const getAllChangeRequests = async (options = {}) => {
  return await getChangeRequests(options);
};

const getChangeRequestDetails = async (id, organisationId = null) => {
  return await getChangeRequestById(id, organisationId);
};

const getActiveChangeRequestsData = async (options = {}) => {
  return await getActiveChangeRequests(options);
};

module.exports = {
  getAllChangeRequests,
  getChangeRequestDetails,
  getActiveChangeRequestsData,
};
