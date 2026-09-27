const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const responseService = require('./response.service');

describe('Response Service', () => {
  it('should structure response payload as expected for service_request intent', () => {
    const query = 'I need a laptop';
    const intent = 'service_request';
    const knowledge = [
      { id: 'k1', title: 'Hardware Policy', content: 'You can request a laptop.' }
    ];
    const recommendations = [
      { action: 'apply', targetId: '1', description: 'Request a Laptop' }
    ];

    const response = responseService.structureResponse(query, intent, knowledge, recommendations);

    assert.equal(response.type, 'service_request');
    assert.equal(response.message, 'Based on your request "I need a laptop", here are the recommended services you can apply for.');

    // Knowledge formatting
    assert.equal(response.knowledge.length, 1);
    assert.equal(response.knowledge[0].id, 'k1');
    assert.equal(response.knowledge[0].title, 'Hardware Policy');
    assert.equal(response.knowledge[0].summary, 'You can request a laptop.');

    // Recommendation formatting
    assert.equal(response.recommendations.length, 1);
    assert.equal(response.recommendations[0].action, 'apply');
    assert.equal(response.recommendations[0].targetId, '1');
    assert.equal(response.recommendations[0].description, 'Request a Laptop');

    // processedAt metadata generated
    assert.ok(response.metadata);
    assert.ok(response.metadata.processedAt);
    const date = new Date(response.metadata.processedAt);
    assert.ok(!isNaN(date.getTime()), 'processedAt should be a valid ISO string');
  });

  it('should map intent to the correct response type and message (troubleshooting)', () => {
    const query = 'vpn not working';
    const intent = 'troubleshooting';

    const response = responseService.structureResponse(query, intent, [], []);

    assert.equal(response.type, 'troubleshooting');
    assert.equal(response.message, 'I found some helpful articles in our knowledge base regarding "vpn not working". Please check the recommended steps.');
  });

  it('should map unknown intent to a generic message', () => {
    const query = 'hello world';
    const intent = 'unknown';

    const response = responseService.structureResponse(query, intent, [], []);

    assert.equal(response.type, 'unknown');
    assert.equal(response.message, 'Here is what I found for "hello world".');
  });

  it('should handle missing content in knowledge array (using summary)', () => {
    const knowledge = [
      { id: 'k2', title: 'VPN Setup', summary: 'Use the VPN app.' }
    ];
    const response = responseService.structureResponse('vpn', 'troubleshooting', knowledge, []);

    assert.equal(response.knowledge[0].summary, 'Use the VPN app.');
  });

  it('should handle empty knowledge/recommendations correctly', () => {
    const response = responseService.structureResponse('test', 'unknown', [], []);

    assert.ok(Array.isArray(response.knowledge));
    assert.equal(response.knowledge.length, 0);
    assert.ok(Array.isArray(response.recommendations));
    assert.equal(response.recommendations.length, 0);
  });
});
