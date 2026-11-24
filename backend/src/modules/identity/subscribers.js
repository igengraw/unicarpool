import { STUDENT_REGISTERED } from './studentRegistered.js';
import { createRegistrationStatsConsumer } from './registrationStats.js';

// Connects the consumer to the bus (also used by the tests, so the real wiring is tested).
export function subscribeIdentityEvents(bus, statsRepository) {
  const consumer = createRegistrationStatsConsumer(statsRepository);
  bus.subscribe(STUDENT_REGISTERED, consumer.handle);
  return consumer;
}
