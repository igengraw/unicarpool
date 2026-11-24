// EVENT: a completed business fact ("a student account was created"), named in the past tense.
// It is not a command: it does not ask anybody to do something.
export const STUDENT_REGISTERED = 'StudentRegistered';

export function studentRegistered({ userId, eventId, occurredAt }) {
  return Object.freeze({
    type: STUDENT_REGISTERED,
    eventId,                                 // unique id, used to detect duplicate delivery
    userId,                                  // the business object
    occurredAt: occurredAt.toISOString(),    // date and time
  });
}
