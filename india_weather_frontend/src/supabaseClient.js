import { createClient } from '@supabase/supabase-js';

/**
 * PUBLIC_INTERFACE
 * getSupabaseClient
 * Returns a Supabase client configured from environment variables.
 * Ensure the following variables are provided in the environment:
 * - REACT_APP_SUPABASE_URL
 * - REACT_APP_SUPABASE_KEY
 */
export function getSupabaseClient() {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;

  if (!url || !key) {
    // We don't throw to avoid breaking the UI; log an explicit warning.
    // The UI will still function for public weather fetching that doesn't require Supabase.
    // To enable Supabase features, supply these env vars.
    // Note for operators: set them in the container's .env.
    console.warn(
      'Supabase env vars missing. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY.'
    );
    return null;
  }

  const client = createClient(url, key);
  try {
    console.debug('[SupabaseClient] Created client with provided env vars.');
  } catch {
    // ignore
  }
  return client;
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
