import test from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../../shared/eventBus.js';
import { HttpError } from '../../shared/httpError.js';
import { registerStudent } from './registerStudent.js';
import { studentRegistered, STUDENT_REGISTERED } from './studentRegistered.js';
import { subscribeIdentityEvents } from './subscribers.js';
import { InMemoryRegistrationStats } from './registrationStats.js';

const input = { email: 'a@sdu.edu.kz', password: 'password123', fullName: 'Aida', studentId: '230107014' };
const fixedNow = () => new Date('2026-11-24T10:00:00Z');
const okAuth = { signUp: async () => ({ data: { user: { id: 'user-1', identities: [{}] } }, error: null }) };

function setup(overrides = {}) {
  const bus = new EventBus();
  const stats = new InMemoryRegistrationStats();
  subscribeIdentityEvents(bus, stats);
  const published = [];
  bus.subscribe(STUDENT_REGISTERED, (e) => { published.push(e); });
  const deps = { auth: okAuth, bus, validate: () => {}, now: fixedNow, newId: () => 'evt-1', ...overrides };
  return { bus, stats, published, deps };
}

// Test 1: successful reaction
test('registering a student publishes StudentRegistered and the consumer updates the daily statistic', async () => {
  const { stats, published, deps } = setup();
  const result = await registerStudent(deps, input);
  assert.equal(result.userId, 'user-1');                       // main operation succeeded
  assert.equal(published.length, 1);                           // event published
  assert.deepEqual([published[0].type, published[0].userId, published[0].eventId], ['StudentRegistered', 'user-1', 'evt-1']);
  assert.equal(await stats.countFor('2026-11-24'), 1);         // consumer effect
});

// Test 2: duplicate delivery
test('the same event delivered twice changes the statistic only once', async () => {
  const { bus, stats } = setup();
  const event = studentRegistered({ userId: 'user-1', eventId: 'evt-dup', occurredAt: fixedNow() });
  await bus.publish(event);
  await bus.publish(event);
  assert.equal(await stats.countFor('2026-11-24'), 1);
});

test('failed sign-up publishes no event and changes no statistic', async () => {
  const failingAuth = { signUp: async () => ({ data: null, error: { message: 'boom' } }) };
  const { stats, published, deps } = setup({ auth: failingAuth });
  await assert.rejects(() => registerStudent(deps, input), HttpError);
  assert.equal(published.length, 0);
  assert.equal(await stats.countFor('2026-11-24'), 0);
});

test('invalid registration data (e.g. not a university e-mail) publishes no event', async () => {
  const { published, deps } = setup({ validate: () => { throw new HttpError(400, 'Use your university e-mail'); } });
  await assert.rejects(() => registerStudent(deps, input), /university e-mail/);
  assert.equal(published.length, 0);
});

test('a repeated sign-up of an existing account (no identities) publishes no event', async () => {
  const repeatAuth = { signUp: async () => ({ data: { user: { id: 'user-1', identities: [] } }, error: null }) };
  const { published, deps } = setup({ auth: repeatAuth });
  await registerStudent(deps, input);
  assert.equal(published.length, 0);
});

test('a failing consumer does not break the registration', async () => {
  const { bus, deps } = setup();
  bus.subscribe(STUDENT_REGISTERED, () => { throw new Error('consumer bug'); });
  const origError = console.error; console.error = () => {};
  try { assert.equal((await registerStudent(deps, input)).userId, 'user-1'); } finally { console.error = origError; }
});
