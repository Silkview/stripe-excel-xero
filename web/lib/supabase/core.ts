import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { AdminClient } from './admin';

type SchemaClient = SupabaseClient<Database, 'core'>;

/** App tables live in the `core` Postgres schema (not `public`). */
export function core(client: AdminClient | SupabaseClient<Database>): SchemaClient {
  if (typeof (client as SupabaseClient<Database>).schema === 'function') {
    return (client as SupabaseClient<Database>).schema(
      'core'
    ) as unknown as SchemaClient;
  }
  return client as SchemaClient;
}
