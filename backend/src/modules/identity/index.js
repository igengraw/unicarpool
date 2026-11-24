import { env } from '../../config/env.js';
import { eventBus } from '../../shared/eventBus.js';
import { subscribeIdentityEvents } from './subscribers.js';
import { InMemoryRegistrationStats } from './registrationStats.js';
import { SupabaseRegistrationStats } from './supabaseRegistrationStats.js';

export { router } from './routes.js';

// The statistic is stored in Supabase when the service key is configured, otherwise only in memory.
if (!env.supabaseServiceRoleKey) console.warn('SUPABASE_SERVICE_ROLE_KEY is not set: registration statistics are kept in memory only.');
subscribeIdentityEvents(eventBus, env.supabaseServiceRoleKey ? new SupabaseRegistrationStats() : new InMemoryRegistrationStats());
