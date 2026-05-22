import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from './env';

/**
 * Browser Supabase client backed by localStorage (not SSR cookies).
 * Reliable in the Excel Office dialog; pair with syncBrowserSessionToServer()
 * after sign-in so server routes and the dashboard see the session.
 */
export function createSupabaseBrowser() {
  const { url, anonKey } = getSupabasePublicEnv();
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
