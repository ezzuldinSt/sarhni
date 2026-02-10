import { EventEmitter } from "events";

/**
 * In-memory event emitter for real-time confession broadcasts.
 *
 * This allows the server to push new confessions to connected clients
 * via Server-Sent Events (SSE) without external dependencies.
 *
 * NOTE: For multi-server deployments (horizontal scaling), this should
 * be replaced with Redis Pub/Sub or a similar distributed pub/sub system.
 */

// Singleton event emitter for new confessions
class ConfessionEvents extends EventEmitter {
  constructor() {
    super();
    // Support up to 100 concurrent profile viewers
    // Each viewer maintains one SSE connection
    this.setMaxListeners(100);
  }
}

export const confessionEvents = new ConfessionEvents();

/**
 * Broadcast a new confession to all subscribers listening for this recipient.
 * Called when a new confession is successfully created in the database.
 *
 * @param confession - The newly created confession with sender/receiver data
 * @param receiverId - The ID of the user who received the confession
 */
export function broadcastNewConfession(
  confession: any,
  receiverId: string
): void {
  const eventName = `new-confession-${receiverId}`;
  confessionEvents.emit(eventName, confession);
}

/**
 * Subscribe to new confessions for a specific user.
 * Used by the SSE endpoint to stream updates to connected clients.
 *
 * @param userId - The ID of the user to listen for confessions
 * @param callback - Function called when a new confession is received
 * @returns Subscription object with unsubscribe method
 */
export function subscribeToNewConfessions(
  userId: string,
  callback: (confession: any) => void
): { unsubscribe: () => void } {
  const eventName = `new-confession-${userId}`;
  confessionEvents.on(eventName, callback);

  return {
    unsubscribe: () => {
      confessionEvents.off(eventName, callback);
    },
  };
}
