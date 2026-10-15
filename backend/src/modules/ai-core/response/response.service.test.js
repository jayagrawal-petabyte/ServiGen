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

  it('should use no-results message when arrays are empty (troubleshooting intent)', () => {
    const query = 'vpn not working';
    const intent = 'troubleshooting';

    // CR: Both arrays empty — should produce a no-results message, not an intent message
    const response = responseService.structureResponse(query, intent, [], []);

    assert.equal(response.type, 'troubleshooting');
    assert.equal(response.message, 'No results were found for "vpn not working".');
  });

  it('should use intent message when troubleshooting results are present', () => {
    const query = 'vpn not working';
    const intent = 'troubleshooting';
    const knowledge = [{ id: 'k1', title: 'VPN Guide', content: 'Check your VPN settings.' }];

    const response = responseService.structureResponse(query, intent, knowledge, []);

    assert.equal(response.type, 'troubleshooting');
    assert.equal(response.message, 'I found some helpful articles in our knowledge base regarding "vpn not working". Please check the recommended steps.');
  });

  it('should use no-results message for unknown intent when arrays are empty', () => {
    const query = 'hello world';
    const intent = 'unknown';

    // CR: Both arrays empty — no-results message takes priority over intent message
    const response = responseService.structureResponse(query, intent, [], []);

    assert.equal(response.type, 'unknown');
    assert.equal(response.message, 'No results were found for "hello world".');
  });

  it('should use generic intent message when results are present for unknown intent', () => {
    const query = 'hello world';
    const intent = 'unknown';
    const recommendations = [{ action: 'view', targetId: 'x1', description: 'Some item' }];

    const response = responseService.structureResponse(query, intent, [], recommendations);

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
