#!/usr/bin/env node
/**
 * Apply Supabase SQL migrations via the Management API.
 *
 * Idempotent: skips files whose normalized name already exists in
 * `supabase_migrations.schema_migrations`. The normalized name is the
 * filename without its leading numeric prefix and without `.sql`, so
 * `014_billing_past_due_tracking.sql` is tracked as
 * `billing_past_due_tracking`, matching what the Supabase MCP / dashboard
 * "apply migration" flow writes.
 *
 * Required env:
 *   SUPABASE_ACCESS_TOKEN  Personal access token from supabase.com/dashboard
 *   SUPABASE_PROJECT_REF   The project ref, e.g. szbfksebywhkalejxkgs
 *
 * Optional env:
 *   MIGRATIONS_DIR         Defaults to <repo-root>/supabase/migrations
 *   DRY_RUN=1              Print what would be applied without calling the API
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.supabase.com';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const DRY_RUN = process.env.DRY_RUN === '1';

if (!TOKEN || !PROJECT_REF) {
  console.error(
    'Missing required env: SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF.'
  );
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir =
  process.env.MIGRATIONS_DIR ?? resolve(here, '..', 'supabase', 'migrations');

async function api(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`POST ${path} → ${res.status}: ${text}`);
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function normalizeName(filename) {
  return filename.replace(/^\d+_/, '').replace(/\.sql$/, '');
}

async function getAppliedNames() {
  try {
    const data = await api(`/v1/projects/${PROJECT_REF}/database/query`, {
      query: 'select name from supabase_migrations.schema_migrations',
    });
    const rows = Array.isArray(data) ? data : (data?.result ?? data?.rows ?? []);
    return new Set(rows.map((r) => r?.name).filter(Boolean));
  } catch (err) {
    const msg = String(err);
    // Fresh project: ledger table doesn't exist yet.
    if (
      msg.includes('does not exist') ||
      msg.includes('schema_migrations') ||
      msg.includes('schema "supabase_migrations"')
    ) {
      return new Set();
    }
    throw err;
  }
}

async function main() {
  const entries = await readdir(migrationsDir);
  const files = entries.filter((f) => f.endsWith('.sql')).sort();
  if (files.length === 0) {
    console.log(`No .sql files found in ${migrationsDir}`);
    return;
  }

  const applied = await getAppliedNames();
  console.log(
    `Found ${files.length} migration file(s) in ${migrationsDir}; ${applied.size} already applied.`
  );

  let appliedThisRun = 0;
  for (const file of files) {
    const name = normalizeName(file);
    if (applied.has(name)) {
      console.log(`skip   ${file}  (already applied as "${name}")`);
      continue;
    }
    const sql = await readFile(resolve(migrationsDir, file), 'utf8');
    if (DRY_RUN) {
      console.log(`dryrun ${file} → would apply as "${name}"`);
      continue;
    }
    console.log(`apply  ${file} → "${name}"`);
    await api(`/v1/projects/${PROJECT_REF}/database/migrations`, {
      name,
      query: sql,
    });
    appliedThisRun += 1;
  }

  console.log(
    `Done. Applied ${appliedThisRun} new migration(s).${DRY_RUN ? ' (dry run)' : ''}`
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
