// =============================================================
// EventBus.js — Tiny publish/subscribe event bus
// Decouples all managers and entities. No direct references needed.
// =============================================================

class EventBus {
  constructor() {
    this._listeners = {};
  }

  /** Subscribe to an event. Returns unsubscribe function. */
  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  /** Subscribe once, auto-removes after first call */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  /** Unsubscribe from an event */
  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  /** Emit an event with optional data */
  emit(event, data) {
    if (!this._listeners[event]) return;
    // Iterate over a copy to avoid mutation issues during dispatch
    [...this._listeners[event]].forEach(cb => cb(data));
  }

  /** Remove all listeners (call on scene shutdown) */
  clear() {
    this._listeners = {};
  }
}

// Singleton — shared across all scenes and managers
export const bus = new EventBus();
