import { TRIP_CANCELLED } from './events.js';

// Reliability statistic for moderation: how many trips each driver cancelled.
export class DriverCancellationStats {
  cancelsByDriver = new Map();
  processedEvents = new Map(); // eventId -> driverId ("already counted")

  count(driverId) {
    return this.cancelsByDriver.get(driverId) ?? 0;
  }
}

export function registerDriverCancellationConsumer(bus, stats) {
  bus.subscribe(TRIP_CANCELLED, (event) => {
    if (stats.processedEvents.has(event.eventId)) return; // duplicate delivery
    stats.processedEvents.set(event.eventId, event.driverId);
    stats.cancelsByDriver.set(event.driverId, stats.count(event.driverId) + 1);
  });
}
