
/**
 * SLA formatting helpers for the Incidents module.
 * slaTimeLeft is stored in minutes by the database.
 */

const formatIncidentSla = (minutes) => {
  if (minutes === null || minutes === undefined) {
    return 'N/A';
  }

  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) {
    return 'N/A';
  }

  if (minutes <= 0) {
    return 'SLA Breached';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${remainingMinutes}m`;
};

const addIncidentSlaDetails = (incident) => ({
  ...incident,
  slaFormatted: formatIncidentSla(incident.slaTimeLeft),
  slaBreach:
    typeof incident.slaTimeLeft === 'number' &&
    Number.isFinite(incident.slaTimeLeft) &&
    incident.slaTimeLeft <= 0,
});

module.exports = {
  formatIncidentSla,
  addIncidentSlaDetails,
};
