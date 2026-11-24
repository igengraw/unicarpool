import { anonClient, userClient } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../shared/httpError.js';
import { throwIfError } from '../../shared/dbError.js';
import { eventBus } from '../../shared/eventBus.js';
import { isUniversityEmail } from './validators.js';
import { registerStudent } from './registerStudent.js';

// FR1: all registration rules in one place. If your team added extra SDU rules, keep them here.
function validateRegistration({ email, password, fullName }) {
  if (!isUniversityEmail(email, env.universityEmailDomain))
    throw new HttpError(400, `Use your university e-mail (@${env.universityEmailDomain})`);
  if (typeof password !== 'string' || password.length < 8)
    throw new HttpError(400, 'Password must be at least 8 characters');
  if (!fullName || typeof fullName !== 'string') throw new HttpError(400, 'Full name is required');
}

export const register = (input) =>
  registerStudent({ auth: anonClient.auth, bus: eventBus, validate: validateRegistration }, input);

export async function login({ email, password }) {
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new HttpError(401, 'Invalid e-mail or password');
  return {
    accessToken: data.session.access_token,
    expiresAt: data.session.expires_at,
    user: { id: data.user.id, email: data.user.email },
  };
}

export async function getProfile(token, userId) {
  const { data, error } = await userClient(token)
    .from('profiles').select('id, full_name, role').eq('id', userId).single();
  throwIfError(error);
  return data;
}
