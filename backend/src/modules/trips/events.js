import { randomUUID } from 'node:crypto';

// Event = a completed business fact (past tense), not a command.
export const TRIP_CANCELLED = 'TripCancelled';

export const tripCancelled = (trip) => ({
  type: TRIP_CANCELLED,
  eventId: randomUUID(),
  occurredAt: new Date().toISOString(),
  tripId: trip.id,
  driverId: trip.driver_id,
});
