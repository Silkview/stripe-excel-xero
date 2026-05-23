import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { FALLBACK_PLANS } from './fallback';
import type { PlanCode, PlanRow } from './types';

export function parsePlanFeatures(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features.filter((f): f is string => typeof f === 'string');
  }
  return [];
}

export async function listPlans(): Promise<PlanRow[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await core(admin)
    .from('plans')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    if (error.message.includes('Invalid schema')) {
      return FALLBACK_PLANS;
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    code: row.code as PlanCode,
    name: row.name,
    description: row.description ?? '',
    features: parsePlanFeatures(row.features),
    max_users: row.max_users,
    max_workspaces: row.max_workspaces,
    max_stripe_connections: row.max_stripe_connections,
    max_stripe_connections_per_workspace:
      row.max_stripe_connections_per_workspace ?? 1,
    max_xero_connections_per_workspace:
      row.max_xero_connections_per_workspace ?? 1,
    stripe_price_id: row.stripe_price_id,
    sort_order: row.sort_order,
  }));
}

export async function getPlanByCode(code: PlanCode): Promise<PlanRow | null> {
  const plans = await listPlans();
  return plans.find((p) => p.code === code) ?? null;
}
