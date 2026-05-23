import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { getSupabasePublicEnv } from './env';

export type AdminClient = SupabaseClient<Database, 'core'>;

export function createSupabaseAdmin(): AdminClient {
  const { url } = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Restart the dev server after adding it.'
    );
  }
  return createClient<Database, 'core'>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
