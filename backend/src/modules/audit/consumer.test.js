import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus } from '../../shared/events/eventBus.js';
import { createAuditConsumer } from './consumer.js';
import { reserve } from '../reservations/service.js';

test('successful reservation publishes event and creates audit record', async () => {
  const bus = createEventBus();
  const auditRecords = [];

  const consumer = createAuditConsumer(async (record) => {
    auditRecords.push(record);
  });

  bus.subscribe('ReservationCreated', consumer);

  const reservation = {
    id: 'reservation-1',
    trip_id: 'trip-1',
    passenger_id: 'student-1',
    status: 'confirmed'
  };

  const clientFactory = () => ({
    rpc: async () => ({ data: reservation, error: null })
  });

  const result = await reserve('test-token', 'trip-1', clientFactory, bus.publish);

  assert.deepEqual(result, reservation);
  assert.equal(auditRecords.length, 1);
  assert.equal(auditRecords[0].eventType, 'ReservationCreated');
  assert.equal(auditRecords[0].reservationId, 'reservation-1');
  assert.equal(auditRecords[0].tripId, 'trip-1');
  assert.ok(auditRecords[0].eventId);
  assert.ok(auditRecords[0].occurredAt);
});

test('duplicate event delivery creates only one audit record', async () => {
  const bus = createEventBus();
  const auditRecords = [];

  const consumer = createAuditConsumer(async (record) => {
    auditRecords.push(record);
  });

  bus.subscribe('ReservationCreated', consumer);

  const event = {
    eventId: 'event-1',
    eventType: 'ReservationCreated',
    reservationId: 'reservation-1',
    tripId: 'trip-1',
    occurredAt: '2026-11-24T10:00:00.000Z'
  };

  await bus.publish(event);
  await bus.publish(event);

  assert.equal(auditRecords.length, 1);
});
