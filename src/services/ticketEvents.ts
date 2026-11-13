/**
 * Global Ticket Event Bus
 * Provides instant synchronization across modals, queue tables, and dashboards
 * without requiring full page reloads.
 */

export interface TicketUpdatePayload {
  id: string;
  status?: string;
  agent?: string;
  priority?: string;
  team?: string;
  category?: string;
  isEscalated?: boolean;
  escalatedToTier2?: boolean;
  [key: string]: unknown;
}

export type TicketEvent =
  | { type: 'TICKET_UPDATED'; ticket: TicketUpdatePayload }
  | { type: 'TICKET_CREATED'; ticket: TicketUpdatePayload }
  | { type: 'TICKET_DELETED'; id: string }
  | { type: 'REFRESH_QUEUES' };

type Listener = (event: TicketEvent) => void;
const listeners = new Set<Listener>();

export const ticketEvents = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  emit(event: TicketEvent): void {
    listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error('[ticketEvents] error in listener:', err);
      }
    });
  },
};
