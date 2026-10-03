const express = require('express');
const router = express.Router();
const servicesCatalogueController = require('./services-catalogue.controller');

// GET /services - List and search/filter services
router.get('/', servicesCatalogueController.getServices);

// GET /services/categories - List categories (optional but useful based on requirements)
router.get('/categories', servicesCatalogueController.getCategories);

// GET /services/:serviceId - Get single service detail
router.get('/:serviceId', servicesCatalogueController.getServiceById);

// POST /services/:serviceId/requests - Submit a service request
router.post('/:serviceId/requests', servicesCatalogueController.submitServiceRequest);

module.exports = router;
