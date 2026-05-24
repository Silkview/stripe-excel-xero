'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { PageHeader } from './dashboard-ui';

type StripeConn = {
  id: string;
  stripe_account_id: string;
  display_name: string | null;
};

type XeroConn = {
  id: string;
  tenant_name: string | null;
};

type WorkspaceOption = {
  id: string;
  name: string;
  stripe: StripeConn[];
  xero: XeroConn[];
};

export default function ProDowngradeWizard() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [stripeId, setStripeId] = useState<string | null>(null);
  const [xeroId, setXeroId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/downgrade', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Could not load workspaces.');
        return;
      }
      const list = (data.data?.workspaces ?? []) as WorkspaceOption[];
      setWorkspaces(list);
      if (list.length === 1) {
        setWorkspaceId(list[0].id);
      }
    } catch {
      setError('Could not load workspaces.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = workspaces.find((w) => w.id === workspaceId) ?? null;

  useEffect(() => {
    if (!selected) {
      setStripeId(null);
      setXeroId(null);
      return;
    }
    if (selected.stripe.length === 1) {
      setStripeId(selected.stripe[0].id);
    } else if (selected.stripe.length === 0) {
      setStripeId(null);
    }
    if (selected.xero.length === 1) {
      setXeroId(selected.xero[0].id);
    } else if (selected.xero.length === 0) {
      setXeroId(null);
    }
  }, [selected]);

  const stripeRequired = (selected?.stripe.length ?? 0) > 0;
  const xeroRequired = (selected?.xero.length ?? 0) > 0;
  const canSubmit =
    !!workspaceId &&
    (!stripeRequired || !!stripeId) &&
    (!xeroRequired || !!xeroId);

  const submit = async () => {
    if (!canSubmit || !workspaceId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/downgrade', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          stripeConnectionIds: stripeId ? [stripeId] : [],
          xeroConnectionId: xeroId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? 'Could not complete downgrade.');
        return;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('Could not complete downgrade.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-text-2">Loading your workspaces…</p>;
  }

  return (
    <>
      <PageHeader
        title="Choose what to keep on Pro"
        subtitle="Your Pro plan includes one workspace, one Stripe account, and one Xero organisation. Select which resources to keep; the rest will be removed."
      />

      {error && (
        <p className="mb-4 text-sm text-warn">{error}</p>
      )}

      <section className="max-w-xl rounded-[11px] border border-border bg-surface p-6 shadow-card">
        <h2 className="text-[15px] font-semibold text-ink">1. Workspace</h2>
        <p className="mt-1 text-xs text-text-3">
          Pick one workspace to keep. All others will be deleted.
        </p>
        <ul className="mt-4 space-y-2">
          {workspaces.map((w) => (
            <li key={w.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-rule px-3 py-2 text-sm hover:border-accent/40">
                <input
                  type="radio"
                  name="workspace"
                  checked={workspaceId === w.id}
                  onChange={() => setWorkspaceId(w.id)}
                />
                <span className="font-medium text-ink">{w.name}</span>
                <span className="ml-auto text-xs text-text-3">
                  {w.stripe.length} Stripe · {w.xero.length} Xero
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {selected && selected.stripe.length > 0 && (
        <section className="mt-4 max-w-xl rounded-[11px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">2. Stripe account</h2>
          <p className="mt-1 text-xs text-text-3">
            Choose one Stripe connection to keep on {selected.name}.
          </p>
          <ul className="mt-4 space-y-2">
            {selected.stripe.map((s) => (
              <li key={s.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-rule px-3 py-2 text-sm hover:border-accent/40">
                  <input
                    type="radio"
                    name="stripe"
                    checked={stripeId === s.id}
                    onChange={() => setStripeId(s.id)}
                  />
                  <span className="text-ink">
                    {s.display_name ?? s.stripe_account_id}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {selected && selected.xero.length > 0 && (
        <section className="mt-4 max-w-xl rounded-[11px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">3. Xero organisation</h2>
          <p className="mt-1 text-xs text-text-3">
            Choose one Xero connection to keep on {selected.name}.
          </p>
          <ul className="mt-4 space-y-2">
            {selected.xero.map((x) => (
              <li key={x.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-rule px-3 py-2 text-sm hover:border-accent/40">
                  <input
                    type="radio"
                    name="xero"
                    checked={xeroId === x.id}
                    onChange={() => setXeroId(x.id)}
                  />
                  <span className="text-ink">
                    {x.tenant_name ?? 'Xero organisation'}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6">
        <Button
          variant="primary"
          className="!bg-accent hover:!bg-accent-hover"
          disabled={!canSubmit || submitting}
          onClick={() => void submit()}
        >
          {submitting ? 'Saving…' : 'Confirm and unlock dashboard'}
        </Button>
      </div>
    </>
  );
}
