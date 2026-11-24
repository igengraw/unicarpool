// CONSUMER: reacts to StudentRegistered by updating a statistic "registrations per day".
// Duplicate protection: the repository applies an event only once per eventId (recordOnce -> false for a repeat).
export function createRegistrationStatsConsumer(repository) {
  return {
    handle: async (event) => {
      const day = event.occurredAt.slice(0, 10); // YYYY-MM-DD (UTC)
      return repository.recordOnce(event.eventId, day);
    },
  };
}

// Repository for tests (and fallback when no service key is configured). Same contract as the SQL version.
export class InMemoryRegistrationStats {
  #processed = new Set();
  #byDay = new Map();

  async recordOnce(eventId, day) {
    if (this.#processed.has(eventId)) return false; // already processed: do nothing
    this.#processed.add(eventId);
    this.#byDay.set(day, (this.#byDay.get(day) ?? 0) + 1);
    return true;
  }

  async countFor(day) {
    return this.#byDay.get(day) ?? 0;
  }
}
