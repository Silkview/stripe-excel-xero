'use client';

import { useState } from 'react';
import Button from './ui/Button';
import { startBillingCheckout } from '../utils/billingCheckout';
import { useNotifications } from '../context/NotificationContext';

type Props = {
  billingUrl: string;
  sticky?: boolean;
};

export default function UpgradePlanBanner({ billingUrl, sticky = false }: Props) {
  const { publish, clear } = useNotifications();
  const [loading, setLoading] = useState<'pro' | 'firm' | null>(null);

  const upgrade = async (plan: 'pro' | 'firm') => {
    setLoading(plan);
    clear('upgrade');
    try {
      const result = await startBillingCheckout(plan, 'monthly');
      if (result.url) {
        window.open(result.url, '_blank');
        return;
      }
      publish({
        kind: 'error',
        message: result.error ?? 'Could not start checkout.',
        source: 'upgrade',
      });
    } catch {
      publish({
        kind: 'error',
        message: 'Could not start checkout. Open billing in your browser.',
        source: 'upgrade',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className={`shrink-0 border-b border-accent/30 bg-gradient-to-r from-accent/15 via-accent/10 to-accent/5 px-3.5 py-2.5 shadow-[0_4px_12px_rgba(37,99,235,0.12)] ${
        sticky ? 'sticky top-0 z-20' : ''
      }`}
    >
      <p className="text-xs font-bold text-ink">Upgrade now</p>
      <p className="mt-0.5 text-[11px] text-ink-2 leading-snug">
        Unlock Xero connect, mapping refresh, build, and push to your ledger.
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
          className="self-center text-[11px] text-accent underline"
          onClick={() => window.open(billingUrl, '_blank')}
        >
          Billing
        </button>
      </div>
    </div>
  );
}
