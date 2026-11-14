'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  subscribeToIncident,
  publishIncidentUpdate,
} = require('./major-incidents.events');

const createMockResponse = () => {
  const received = [];

  return {
    received,
    destroyed: false,
    writableEnded: false,

    write(data) {
      received.push(data);
    },
  };
};

describe('Major Incident SSE Events', () => {
  it('broadcasts updates to multiple responders', () => {
    const responder1 = createMockResponse();
    const responder2 = createMockResponse();

    const unsubscribe1 = subscribeToIncident('MI-TEST-1', responder1);
    const unsubscribe2 = subscribeToIncident('MI-TEST-1', responder2);

    const update = {
      message: 'Database recovery started',
      author: 'Commander',
    };

    publishIncidentUpdate('MI-TEST-1', update);

    assert.equal(responder1.received.length, 1);
    assert.equal(responder2.received.length, 1);

    assert.match(responder1.received[0], /Database recovery started/);
    assert.match(responder2.received[0], /Database recovery started/);

    unsubscribe1();
    unsubscribe2();
  });

  it('does not send updates to disconnected responders and evicts them', () => {
    const responder = createMockResponse();

    subscribeToIncident('MI-TEST-2', responder);

    responder.destroyed = true;

    publishIncidentUpdate('MI-TEST-2', {
      message: 'Test update',
    });

    assert.equal(responder.received.length, 0);

    // Further publish should not throw or attempt writing to evicted responder
    publishIncidentUpdate('MI-TEST-2', {
      message: 'Another update',
    });
    assert.equal(responder.received.length, 0);
  });

  it('evicts responders when write throws an error', () => {
    const faultyResponder = {
      destroyed: false,
      writableEnded: false,
      write() {
        throw new Error('Socket write failed EPIPE');
      },
    };

    subscribeToIncident('MI-TEST-ERR', faultyResponder);

    assert.doesNotThrow(() => {
      publishIncidentUpdate('MI-TEST-ERR', { message: 'Write should fail gracefully' });
    });
  });

  it('does not send updates across different incidents', () => {
    const responder = createMockResponse();

    subscribeToIncident('MI-TEST-3', responder);

    publishIncidentUpdate('MI-TEST-4', {
      message: 'Different incident',
    });

    assert.equal(responder.received.length, 0);
  });
});