const STORAGE_KEY = 'sgc_client_id';

/**
 * Returns a stable per-browser id, creating and persisting one on first
 * use. This is NOT identity or authentication — it's just enough for
 * the reactions API to recognize "this is the same visitor clicking
 * again" so a like toggles instead of stacking. Clearing site data or
 * switching browsers/devices resets it, which is an accepted tradeoff
 * for a lightweight, account-free reaction system.
 */
export function getClientId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
