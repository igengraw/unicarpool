// Minimal in-process event bus (no broker). Consumers are isolated: a failing
// consumer never breaks the business operation that published the event.
export class EventBus {
  #handlers = new Map();

  subscribe(type, handler) {
    this.#handlers.set(type, [...(this.#handlers.get(type) ?? []), handler]);
  }

  async publish(event) {
    for (const handler of this.#handlers.get(event.type) ?? []) {
      try {
        await handler(event);
      } catch (e) {
        console.error(`consumer failed for ${event.type}:`, e.message);
      }
    }
  }
}

export const eventBus = new EventBus();
