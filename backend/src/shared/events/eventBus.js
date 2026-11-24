export function createEventBus() {
  const subscribers = new Map();

  function subscribe(eventType, handler) {
    if (!subscribers.has(eventType)) {
      subscribers.set(eventType, new Set());
    }

    subscribers.get(eventType).add(handler);

    return () => subscribers.get(eventType)?.delete(handler);
  }

  async function publish(event) {
    const handlers = subscribers.get(event.eventType) ?? [];

    await Promise.all([...handlers].map((handler) => handler(event)));
  }

  return { subscribe, publish };
}

export const eventBus = createEventBus();
