/**
 * Verifies the hosted Supabase Data API exposes the `core` schema (PostgREST).
 * Without this, all inserts to core.accounts / core.workspaces fail with "Invalid schema: core".
 */
export async function assertCoreApiSchema(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return;
  }

  const res = await fetch(`${url}/rest/v1/plans?select=code&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
      'Accept-Profile': 'core',
      'Content-Profile': 'core',
    },
  });

  if (res.ok) {
    return;
  }

  let hint = '';
  try {
    const body = (await res.json()) as { message?: string; hint?: string };
    hint = body.hint ?? body.message ?? '';
  } catch {
    hint = `HTTP ${res.status}`;
  }

  throw new Error(
    `Supabase Data API cannot access the "core" schema (${hint}). ` +
      'In Supabase Dashboard → Project Settings → Data API → Exposed schemas, add `core` alongside `public`, save, then restart the dev server.'
  );
}
