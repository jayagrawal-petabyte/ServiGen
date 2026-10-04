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
      }),
      (error) => error.statusCode === 400 && /protected fields/.test(error.message),
    );

    const incident = await majorIncidentsService.getMajorIncidentById('MI-001');
    assert.equal(incident.id, 'MI-001');
    assert.ok(Array.isArray(incident.updates));
  });

  it('validates editable field types and values before mutation', async () => {
    await assert.rejects(
      majorIncidentsService.changeMajorIncident('MI-001', { priority: null }),
      (error) => error.statusCode === 400 && /priority/.test(error.message),
    );
    await assert.rejects(
      majorIncidentsService.changeMajorIncident('MI-001', { status: '' }),
      (error) => error.statusCode === 400 && /status/.test(error.message),
    );
    await assert.rejects(
      majorIncidentsService.changeMajorIncident('MI-001', { title: 123 }),
      (error) => error.statusCode === 400 && /title/.test(error.message),
    );
  });

  it('accepts valid incident edits', async () => {
    const incident = await majorIncidentsService.changeMajorIncident('MI-001', {
      title: 'Customer portal availability issue',
      commander: 'Jasmini',
      status: 'Monitoring',
    });

    assert.equal(incident.title, 'Customer portal availability issue');
    assert.equal(incident.commander, 'Jasmini');
    assert.equal(incident.status, 'Monitoring');
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
});
