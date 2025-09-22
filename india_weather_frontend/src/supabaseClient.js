import { createClient } from '@supabase/supabase-js';

// Module-scoped singleton reference.
// In browser tests with JSDOM and React Fast Refresh, modules can re-evaluate,
// so we keep the instance at module scope and lazily initialize exactly once.
let supabaseSingleton = null;

/**
 * PUBLIC_INTERFACE
 * getSupabaseClient
 * Returns a module-scoped singleton Supabase client configured from environment variables.
 * Ensures only a single GoTrueClient is created to suppress duplicate warnings in tests and runtime.
 * Environment variables required:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 */
export function getSupabaseClient() {
  // If already initialized, return the same instance
  if (supabaseSingleton) return supabaseSingleton;

  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;

  if (!url || !key) {
    // Do not throw: app can run without Supabase for public features.
    // Keep warning minimal to avoid noisy test output.
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[Supabase] Missing env vars REACT_APP_SUPABASE_URL/REACT_APP_SUPABASE_KEY; auth features disabled.'
      );
    }
    supabaseSingleton = null;
    return supabaseSingleton;
  }

  // Lazily create the client once
  supabaseSingleton = createClient(url, key);
  try {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('[SupabaseClient] Initialized singleton client.');
    }
  } catch {
    // ignore console failures
  }
  return supabaseSingleton;
}

/**
 * PUBLIC_INTERFACE
 * logEvent
 * Log a simple usage event to Supabase if configured.
 * @param {string} type - Event type (e.g., 'refresh', 'location_granted', 'location_denied')
 * @param {object} payload - Additional data to store
 */
export async function logEvent(type, payload = {}) {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const { error } = await client.from('events').insert({
      type,
      payload,
      created_at: new Date().toISOString(),
    });
    if (error) {
      // Non-fatal: just warn in console
      console.warn('Supabase logEvent error:', error.message);
    }
  } catch (e) {
    console.warn('Supabase logEvent exception:', e);
  }
}

// Optional: expose a testing-only reset to avoid cross-test pollution.
// Not exported in builds; Jest can mock this module anyway.
// Uncomment if needed in specialized test environments.
// export function __resetSupabaseSingleton() { supabaseSingleton = null; }
