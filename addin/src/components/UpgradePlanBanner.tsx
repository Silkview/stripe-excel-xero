'use client';

import { useState } from 'react';
import Button from './ui/Button';
import { startBillingCheckout } from '../utils/billingCheckout';

type Props = {
  billingUrl: string;
};

export default function UpgradePlanBanner({ billingUrl }: Props) {
  const [loading, setLoading] = useState<'pro' | 'firm' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upgrade = async (plan: 'pro' | 'firm') => {
    setLoading(plan);
    setError(null);
    try {
      const result = await startBillingCheckout(plan, 'monthly');
      if (result.url) {
        window.open(result.url, '_blank');
        return;
      }
      setError(result.error ?? 'Could not start checkout.');
    } catch {
      setError('Could not start checkout. Open billing in your browser.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-3.5 mt-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5">
      <p className="text-xs font-semibold text-ink">
        Upgrade to connect Xero and push to your ledger
      </p>
      <p className="mt-1 text-[11px] text-ink-2 leading-snug">
        Free includes Stripe pulls. Pro and Firm unlock Xero connect, mapping
        refresh, build, and push.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          variant="build"
          className="!py-1 !px-2.5 !text-[11px]"
          disabled={loading !== null}
          onClick={() => void upgrade('pro')}
        >
          {loading === 'pro' ? 'Opening…' : 'Upgrade to Pro'}
        </Button>
        <Button
          variant="secondary"
          className="!py-1 !px-2.5 !text-[11px]"
          disabled={loading !== null}
          onClick={() => void upgrade('firm')}
        >
          {loading === 'firm' ? 'Opening…' : 'Upgrade to Firm'}
        </Button>
        <button
          type="button"
          className="text-[11px] text-accent underline self-center"
          onClick={() => window.open(billingUrl, '_blank')}
        >
          Billing
        </button>
      </div>
      {error && <p className="mt-1.5 text-[10px] text-warn-text">{error}</p>}
    </div>
  );
}
