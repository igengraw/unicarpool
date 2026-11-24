import { adminClient } from '../../config/supabase.js';

// Production repository: one SQL function does "insert eventId (PRIMARY KEY) + increment counter" atomically.
export class SupabaseRegistrationStats {
  async recordOnce(eventId, day) {
    const { data, error } = await adminClient().rpc('record_student_registered', { p_event_id: eventId, p_day: day });
    if (error) throw new Error(error.message);
    return data === true;
  }
}
