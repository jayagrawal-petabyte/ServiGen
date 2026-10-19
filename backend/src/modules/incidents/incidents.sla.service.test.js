
const {
  formatIncidentSla,
  addIncidentSlaDetails,
} = require('./incidents.sla.service');

describe('Incidents SLA Service', () => {
  test.each([
    [null, 'N/A'],
    [undefined, 'N/A'],
    [0, 'SLA Breached'],
    [-5, 'SLA Breached'],
    [45, '45m'],
    [120, '2h 0m'],
    [150, '2h 30m'],
    ['60', 'N/A'],
    [Infinity, 'N/A'],
  ])('formats %p as %s', (minutes, expected) => {
    expect(formatIncidentSla(minutes)).toBe(expected);
  });

  test('adds formatted SLA fields without mutating the incident', () => {
    const incident = {
      id: 'INC-1001',
      slaTimeLeft: 90,
    };

    expect(addIncidentSlaDetails(incident)).toEqual({
      id: 'INC-1001',
      slaTimeLeft: 90,
      slaFormatted: '1h 30m',
      slaBreach: false,
    });

    expect(incident).toEqual({
      id: 'INC-1001',
      slaTimeLeft: 90,
    });
  });

  test('marks zero remaining minutes as breached', () => {
    const result = addIncidentSlaDetails({
      id: 'INC-1002',
      slaTimeLeft: 0,
    });

    expect(result.slaFormatted).toBe('SLA Breached');
    expect(result.slaBreach).toBe(true);
  });

  test('does not mark a missing SLA as breached', () => {
    const result = addIncidentSlaDetails({
      id: 'INC-1003',
      slaTimeLeft: null,
    });

    expect(result.slaFormatted).toBe('N/A');
    expect(result.slaBreach).toBe(false);
  });
});
