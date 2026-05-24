import { requireUser, getAccountMembership } from '@/lib/api-auth';
import { getStripe } from '@/lib/stripe-billing';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { handleOptions, handleRouteError, ok } from '@/lib/route-handler';
import { jsonError } from '@/lib/api-response';
import { withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireUser(request);
    const membership = await getAccountMembership(user.id);
    if (!membership || membership.role === 'member') {
      return withCors(request, jsonError('FORBIDDEN', 'Admins only.', 403));
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return withCors(
        request,
        jsonError('VALIDATION_ERROR', 'Account name is required.', 400)
      );
    }

    const admin = createSupabaseAdmin();
    const { data: account, error } = await core(admin)
      .from('accounts')
      .update({ name: name.trim().slice(0, 120) })
      .eq('id', membership.account_id)
      .select('id, name')
      .single();

    if (error || !account) {
      return withCors(
        request,
        jsonError('DB_ERROR', error?.message ?? 'Failed to rename account.', 500)
      );
    }

    return ok(request, { name: account.name });
  } catch (err) {
    return handleRouteError(request, err);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await requireUser(request);
    const membership = await getAccountMembership(user.id);
    if (!membership) {
      return withCors(request, jsonError('ACCOUNT_REQUIRED', 'No account.', 403));
    }
    if (membership.role !== 'owner') {
      return withCors(
        request,
        jsonError('FORBIDDEN', 'Only the account owner can delete the account.', 403)
      );
    }

    const admin = createSupabaseAdmin();
    const { data: account } = await core(admin)
      .from('accounts')
      .select('stripe_subscription_id')
      .eq('id', membership.account_id)
      .single();

    if (account?.stripe_subscription_id) {
      try {
        await getStripe().subscriptions.cancel(account.stripe_subscription_id);
      } catch (err) {
        console.error('Stripe subscription cancel on account delete:', err);
      }
    }

    const { error } = await core(admin)
      .from('accounts')
      .delete()
      .eq('id', membership.account_id);

    if (error) {
      return withCors(
        request,
        jsonError('DB_ERROR', error.message, 500)
      );
    }

    return ok(request, { signedOut: true });
  } catch (err) {
    return handleRouteError(request, err);
  }
}
