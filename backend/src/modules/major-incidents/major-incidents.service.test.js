const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const majorIncidentsService = require('./major-incidents.service');

describe('Major Incidents Service', () => {
  it('rejects protected fields and leaves the incident usable', async () => {
    await assert.rejects(
      majorIncidentsService.changeMajorIncident('MI-001', {
        id: 'MI-corrupted',
        updates: null,
        status: '',
        version: 1,
      }),
      (error) => error.statusCode === 400 && /protected fields/.test(error.message),
    );

    const incident = await majorIncidentsService.getMajorIncidentById('MI-001');
    assert.equal(incident.id, 'MI-001');
    assert.ok(Array.isArray(incident.updates));
  });

  it('validates editable field types and values before mutation', async () => {
    await assert.rejects(
      majorIncidentsService.changeMajorIncident('MI-001', { priority: null, version: 1 }),
      (error) => error.statusCode === 400 && /priority/.test(error.message),
    );
    await assert.rejects(
      majorIncidentsService.changeMajorIncident('MI-001', { status: '', version: 1 }),
      (error) => error.statusCode === 400 && /status/.test(error.message),
    );
    await assert.rejects(
      majorIncidentsService.changeMajorIncident('MI-001', { title: 123, version: 1 }),
      (error) => error.statusCode === 400 && /title/.test(error.message),
    );
  });

  it('accepts valid incident edits', async () => {
    const incident = await majorIncidentsService.changeMajorIncident('MI-001', {
      title: 'Customer portal availability issue',
      commander: 'Jasmini',
      status: 'Escalated',
      version: 1,
    });

    assert.equal(incident.title, 'Customer portal availability issue');
    assert.equal(incident.commander, 'Jasmini');
    assert.equal(incident.status, 'Escalated');
    assert.equal(incident.version, 2);
  });

  it('generates distinct incident and activity IDs under a fixed clock', async () => {
    const originalNow = Date.now;
    Date.now = () => 1234567890000;

    try {
      const first = await majorIncidentsService.createMajorIncident({
        title: 'First test incident',
        description: 'Description',
        priority: 'P1',
        impact: 'Test impact',
        affectedServices: [],
      });
      const second = await majorIncidentsService.createMajorIncident({
        title: 'Second test incident',
        description: 'Description',
        priority: 'P2',
        impact: 'Test impact',
        affectedServices: [],
      });
      const firstUpdate = await majorIncidentsService.createIncidentUpdate(first.id, { message: 'One' });
      const firstUpdateId = firstUpdate.updates.at(-1).id;
      const secondUpdate = await majorIncidentsService.createIncidentUpdate(first.id, { message: 'Two' });
      const secondUpdateId = secondUpdate.updates.at(-1).id;

      assert.notEqual(first.id, second.id);
      assert.match(first.id, /^MI-/);
      assert.notEqual(firstUpdateId, secondUpdateId);
      assert.match(firstUpdateId, new RegExp(`^${first.id}-U`));
    } finally {
      Date.now = originalNow;
    }
  });

    it('rejects missing, empty, whitespace-only, and non-string update messages', async () => {
    const invalidMessages = [
      undefined,
      '',
      '   ',
      123,
    ];

    for (const message of invalidMessages) {
      await assert.rejects(
        majorIncidentsService.createIncidentUpdate('MI-001', { message }),
        (error) =>
          error.statusCode === 400 &&
          /message must be a non-empty string/.test(error.message),
      );
    }
  });
      it('uses the authenticated author instead of a client-supplied author', async () => {
    const incident = await majorIncidentsService.createIncidentUpdate(
      'MI-001',
      {
        message: 'Database recovery is in progress',
        author: 'Fake User',
      },
      'verified@example.com',
    );

    const latestUpdate = incident.updates.at(-1);

    assert.equal(latestUpdate.author, 'verified@example.com');
  });

  it('prevents mass-assignment on creation by forcing Started status and Unassigned commander', async () => {
    const incident = await majorIncidentsService.createMajorIncident({
      title: 'Mass assignment probe',
      description: 'Attempt to force status and commander',
      priority: 'P1',
      impact: 'Critical',
      affectedServices: ['Payment'],
      status: 'Closed',
      commander: 'Hacker',
    });

    assert.equal(incident.status, 'Started');
    assert.equal(incident.commander, 'Unassigned');
  });

  it('sanitizes HTML tags and enforces length bounds', async () => {
    const sanitizedIncident = await majorIncidentsService.createMajorIncident({
      title: '<script>alert(1)</script>Test Incident',
      description: '<img src=x onerror=alert(2)>Database outage',
      priority: 'P2',
      impact: '<b>High</b>',
      affectedServices: [],
    });

    assert.equal(sanitizedIncident.title, 'Test Incident');
    assert.equal(sanitizedIncident.description, 'Database outage');

    // Title length limit
    await assert.rejects(
      majorIncidentsService.createMajorIncident({
        title: 'A'.repeat(256),
        description: 'Valid',
        priority: 'P1',
        impact: 'High',
        affectedServices: [],
      }),
      (err) => err.statusCode === 400 && /title must not exceed 255 characters/.test(err.message),
    );

    // Message length limit
    await assert.rejects(
      majorIncidentsService.createIncidentUpdate('MI-001', { message: 'M'.repeat(2001) }),
      (err) => err.statusCode === 400 && /message must not exceed 2000 characters/.test(err.message),
    );
  });

  it('enforces sequential state changes and rejects stale update versions', async () => {
    const incident = await majorIncidentsService.createMajorIncident({
      title: 'State-machine test',
      description: 'Validate lifecycle controls.',
      priority: 'P1',
      impact: 'High',
      affectedServices: ['Portal'],
    });

    await assert.rejects(
      majorIncidentsService.changeMajorIncident(incident.id, { status: 'Resolved', version: 1 }),
      (err) => err.statusCode === 409 && /Invalid status transition/.test(err.message),
    );

    const escalated = await majorIncidentsService.changeMajorIncident(incident.id, {
      status: 'Escalated',
      version: 1,
    });
    assert.equal(escalated.version, 2);

    await assert.rejects(
      majorIncidentsService.changeMajorIncident(incident.id, { status: 'Mitigated', version: 1 }),
      (err) => err.statusCode === 409 && /modified/.test(err.message),
    );
  });
});
