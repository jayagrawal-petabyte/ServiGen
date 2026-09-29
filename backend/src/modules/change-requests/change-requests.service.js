// Implementation Summary: Service layer for Change Requests, acting as the intermediary between the controller and the mock data model.
const {
  getChangeRequests,
  getChangeRequestById,
  getActiveChangeRequests,
} = require('./change-requests.model');

const getAllChangeRequests = async () => {
  return await getChangeRequests();
};

const getChangeRequestDetails = async (id) => {
  return await getChangeRequestById(id);
};

const getActiveChangeRequestsData = async () => {
  return await getActiveChangeRequests();
};

module.exports = {
  getAllChangeRequests,
  getChangeRequestDetails,
  getActiveChangeRequestsData,
};
