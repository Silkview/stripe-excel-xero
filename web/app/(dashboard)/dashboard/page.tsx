import { createSupabaseServer } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { core } from '@/lib/supabase/core';
import { getAccountMembership } from '@/lib/api-auth';
import Button from '@/components/ui/Button';
import BillingPortalButton from '@/components/dashboard/BillingPortalButton';

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const membership = user ? await getAccountMembership(user.id) : null;

  let plan = 'trialing';
  if (membership) {
    const admin = createSupabaseAdmin();
    const { data: account } = await core(admin)
      .from('accounts')
      .select('plan, subscription_status, max_users, max_workspaces')
      .eq('id', membership.account_id)
      .single();
    if (account?.plan) plan = account.plan;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="mt-2 text-text-2">
          Welcome back{user?.email ? `, ${user.email}` : ''}.
        </p>
      </div>

      <section className="rounded border border-border bg-surface p-6 shadow-card">
        <h2 className="font-semibold text-text">Your plan</h2>
        <p className="mt-2 capitalize text-text-2">
          Current plan: <span className="font-medium text-text">{plan}</span>
        </p>
        <div className="mt-4">
          <BillingPortalButton />
        </div>
        <p className="mt-2 text-xs text-text-3">
          Billing portal opens via API — use the Excel add-in for day-to-day sync work.
        </p>
      </section>

      <section className="rounded border border-border bg-surface p-6 shadow-card">
        <h2 className="font-semibold text-text">Excel add-in</h2>
        <ol className="mt-3 list-decimal list-inside space-y-2 text-sm text-text-2">
          <li>Sideload <code className="font-mono text-xs bg-bg px-1 py-0.5 rounded">addin/manifest.xml</code> in Excel.</li>
          <li>Open the Silkview Sync task pane and click <strong>Sign in</strong>.</li>
          <li>Connect Xero first (base currency), then Stripe, and run Pull → Build → Push.</li>
        </ol>
        <div className="mt-4">
          <Button href="/auth/login?return=excel" variant="primary">
            Sign in for Excel
          </Button>
        </div>
      </section>

      <section className="rounded border border-xero/30 bg-xero-light/40 p-6">
        <h2 className="font-semibold text-xero-text">Security</h2>
        <p className="mt-2 text-sm text-text-2">
          You can enable two-factor authentication with an authenticator app at any time.
        </p>
        <Button href="/auth/mfa/enroll" variant="xero" className="mt-4">
          Set up MFA
        </Button>
      </section>
    </div>
  );
}
