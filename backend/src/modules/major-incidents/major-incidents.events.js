'use strict';

const subscribers = new Map();

const subscribeToIncident = (incidentId, response) => {
  if (!subscribers.has(incidentId)) {
    subscribers.set(incidentId, new Set());
  }

  const clients = subscribers.get(incidentId);
  clients.add(response);

  return () => {
    clients.delete(response);

    if (clients.size === 0) {
      subscribers.delete(incidentId);
    }
  };
};

const publishIncidentUpdate = (incidentId, update) => {
  const clients = subscribers.get(incidentId);

  if (!clients) return;

  const event = `event: incident-update\ndata: ${JSON.stringify(update)}\n\n`;

  for (const client of clients) {
    if (client.destroyed || client.writableEnded) {
      clients.delete(client);
    } else {
      try {
        client.write(event);
      } catch {
        clients.delete(client);
      }
    }
  }

  if (clients.size === 0) {
    subscribers.delete(incidentId);
  }
};

module.exports = {
  subscribeToIncident,
  publishIncidentUpdate,
};
