const servicesCatalogueService = require('./services-catalogue.service');

const getServices = async (req, res) => {
  try {
    const { category, search } = req.query;
    const services = await servicesCatalogueService.fetchServices(category, search);
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await servicesCatalogueService.fetchCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await servicesCatalogueService.fetchServiceById(serviceId);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const submitServiceRequest = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const requestData = req.body;

    if (!requestData || Object.keys(requestData).length === 0) {
      return res.status(400).json({ success: false, message: 'Request body is missing' });
    }

    const newRequest = await servicesCatalogueService.createServiceRequest(serviceId, requestData);
    res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    if (error.message === 'Service not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === 'Service is not available for requests') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getServices,
  getCategories,
  getServiceById,
  submitServiceRequest
};
