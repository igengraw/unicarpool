import { randomUUID } from 'node:crypto';
import { HttpError } from '../../shared/httpError.js';
import { studentRegistered } from './studentRegistered.js';

// Use case "register a student". Dependencies are passed in (a seam), so tests need no real Supabase.
export async function registerStudent(
  { auth, bus, validate, now = () => new Date(), newId = randomUUID },
  input,
) {
  validate(input); // throws HttpError for invalid input (university e-mail, password, ...)

  const { data, error } = await auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: { data: { full_name: input.fullName.trim(), student_id: input.studentId || '' } },
  });
  if (error) throw new HttpError(400, error.message);

  // PUBLISHER: the main operation succeeded, so the fact is announced.
  // Supabase answers a repeated sign-up with a user without identities: nobody new was registered.
  const user = data?.user;
  const isNew = Boolean(user) && !(Array.isArray(user.identities) && user.identities.length === 0);
  if (isNew) await bus.publish(studentRegistered({ userId: user.id, eventId: newId(), occurredAt: now() }));

  return { message: 'Check your university e-mail to confirm your account.', userId: user?.id };
}
