/**
 * Broadcast a value via localStorage so other tabs receive the `storage` event,
 * then immediately remove it so it doesn't linger.
 */
export function broadcastAndClear(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    setTimeout(() => { try { localStorage.removeItem(key); } catch (_) {} }, 500);
  } catch (_) {}
}

/**
 * Remove transient keys that we write only for cross-tab communication.
 */
export function clearTransientLocalStorage() {
  const keysToRemove = ['app_logout_handled', 'settings_updated', 'session_timeout_enabled'];
  keysToRemove.forEach((key) => {
    try { localStorage.removeItem(key); } catch (_) {}
  });
}
