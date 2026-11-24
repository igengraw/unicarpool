import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.UNIVERSITY_EMAIL_DOMAIN = 'sdu.edu.kz';

const { cancelTrip } = await import('./service.js');
const { EventBus } = await import('../../shared/eventBus.js');
const { registerDriverCancellationConsumer, DriverCancellationStats } = await import('./driverCancellationStats.js');
const { tripCancelled, TRIP_CANCELLED } = await import('./events.js');

const cancelledTrip = { id: 'trip-1', driver_id: 'driver-1', status: 'cancelled' };

test('cancelTrip publishes TripCancelled and driver cancellation counter grows', async () => {
  const bus = new EventBus();
  const stats = new DriverCancellationStats();
  const published = [];
  bus.subscribe(TRIP_CANCELLED, (e) => published.push(e));
  registerDriverCancellationConsumer(bus, stats);

  const update = async (token, id, fields) => {
    assert.equal(id, 'trip-1');
    assert.deepEqual(fields, { status: 'cancelled' });
    return cancelledTrip;
  };

  const result = await cancelTrip('token', 'trip-1', { update, bus });

  assert.equal(result.status, 'cancelled');
  assert.equal(published.length, 1);
  assert.equal(published[0].tripId, 'trip-1');
  assert.equal(stats.count('driver-1'), 1);
});

test('duplicate TripCancelled is counted only once', async () => {
  const bus = new EventBus();
  const stats = new DriverCancellationStats();
  registerDriverCancellationConsumer(bus, stats);

  const event = tripCancelled(cancelledTrip);
  await bus.publish(event);
  await bus.publish(event);

  assert.equal(stats.count('driver-1'), 1);
});

test('failed cancellation publishes no event', async () => {
  const bus = new EventBus();
  const stats = new DriverCancellationStats();
  registerDriverCancellationConsumer(bus, stats);

  await assert.rejects(cancelTrip('token', 'trip-1', { update: async () => { throw new Error('not found'); }, bus }));
  assert.equal(stats.count('driver-1'), 0);
});
