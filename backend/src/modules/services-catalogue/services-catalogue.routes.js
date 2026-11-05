'use strict';

const express = require('express');
const router = express.Router();
const servicesCatalogueController = require('./services-catalogue.controller');

// GET /services - List and search/filter services
router.get('/', servicesCatalogueController.getServices);

// GET /services/categories - List categories
router.get('/categories', servicesCatalogueController.getCategories);

// GET /services/requests - List submitted service requests
router.get('/requests', servicesCatalogueController.getServiceRequests);

// GET /services/requests/:requestId - Get service request detail
router.get('/requests/:requestId', servicesCatalogueController.getServiceRequestDetail);

// GET /services/:serviceId - Get single service detail
router.get('/:serviceId', servicesCatalogueController.getServiceById);

// POST /services/:serviceId/requests (and alias /request) - Submit a service request
router.post('/:serviceId/requests', servicesCatalogueController.submitServiceRequest);
router.post('/:serviceId/request', servicesCatalogueController.submitServiceRequest);

module.exports = router;
