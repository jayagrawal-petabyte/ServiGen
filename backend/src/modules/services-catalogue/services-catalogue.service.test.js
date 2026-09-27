const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const servicesCatalogueService = require('./services-catalogue.service');

describe('Services Catalogue Service', () => {
  it('should fetch all services when no filters are provided', async () => {
    const services = await servicesCatalogueService.fetchServices();
    assert.ok(Array.isArray(services));
    assert.equal(services.length, 4, 'Should return all 4 mock services');
  });

  it('should filter services by category', async () => {
    const hardwareServices = await servicesCatalogueService.fetchServices('Hardware');
    assert.equal(hardwareServices.length, 2);
    assert.equal(hardwareServices[0].category, 'Hardware');
    assert.equal(hardwareServices[1].category, 'Hardware');
  });

  it('should filter services by search query', async () => {
    const searchResults = await servicesCatalogueService.fetchServices(null, 'adobe');
    assert.equal(searchResults.length, 1);
    assert.equal(searchResults[0].name, 'Adobe Creative Cloud');
  });

  it('should filter services by both category and search query', async () => {
    const results = await servicesCatalogueService.fetchServices('Hardware', 'laptop');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, '1');
  });

  it('should fetch a service by ID', async () => {
    const service = await servicesCatalogueService.fetchServiceById('2');
    assert.ok(service);
    assert.equal(service.name, 'VPN Access');
  });

  it('should return null for unknown service ID behavior', async () => {
    const service = await servicesCatalogueService.fetchServiceById('unknown-id');
    assert.equal(service, null);
  });

  it('should create a service request and assign Pending Approval status', async () => {
    const requestData = { requester: 'Alice' };
    const request = await servicesCatalogueService.createServiceRequest('1', requestData);

    assert.ok(request.id.startsWith('req_'));
    assert.equal(request.requester, 'Alice');
    assert.equal(request.serviceId, '1');
    assert.equal(request.serviceName, 'Request a Laptop');
    assert.equal(request.status, 'Pending Approval');
    assert.ok(request.submittedAt);
  });

  it('should fail to create a request for an unknown service', async () => {
    await assert.rejects(
      servicesCatalogueService.createServiceRequest('invalid-id', {}),
      /Service not found/
    );
  });
});
