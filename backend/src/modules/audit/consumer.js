export function createAuditConsumer(writeAuditRecord) {
  const processedEventIds = new Set();

  return async function consumeReservationCreated(event) {
    if (processedEventIds.has(event.eventId)) {
      return false;
    }

    await writeAuditRecord({
      eventId: event.eventId,
      eventType: event.eventType,
      reservationId: event.reservationId,
      tripId: event.tripId,
      occurredAt: event.occurredAt
    });

    processedEventIds.add(event.eventId);

    return true;
  };
}
