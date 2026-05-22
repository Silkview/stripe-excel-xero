import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/** App tables live in the `core` Postgres schema (not `public`). */
export function core(client: SupabaseClient<Database>) {
  return client.schema('core');
}
