// Implementation Summary: Controller for Change Requests, handling HTTP request parsing and wrapping service responses in standard JSON format.
const {
  getAllChangeRequests,
  getChangeRequestDetails,
  getActiveChangeRequestsData,
} = require('./change-requests.service');

const getChangeRequestsList = async (req, res) => {
  try {
    const changeRequests = await getAllChangeRequests();
    res.status(200).json({
      success: true,
      data: changeRequests,
    });
  } catch (error) {
    console.error('Error fetching change requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch change requests',
    });
  }
};

const getActiveChangeRequestsList = async (req, res) => {
  try {
    const activeChangeRequests = await getActiveChangeRequestsData();
    res.status(200).json({
      success: true,
      data: activeChangeRequests,
    });
  } catch (error) {
    console.error('Error fetching active change requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active change requests',
    });
  }
};

const getChangeRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const changeRequest = await getChangeRequestDetails(id);

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
    console.error('Error fetching change request details:', error);
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