'use client';

import { useEffect, useState } from 'react';

type VerifyData = {
  paired: boolean;
  connectApiEnabled: boolean;
  secretMode: string;
  redirectUri: string;
  hint: string;
  note?: string;
};

export default function StripeConnectHealth() {
  const [data, setData] = useState<VerifyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/stripe/connect/verify', {
          credentials: 'include',
        });
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error?.message ?? 'Could not load Stripe Connect status.');
        }
      } catch {
        setError('Could not load Stripe Connect status.');
      }
    })();
  }, []);

  return (
    <section className="rounded-[11px] border border-border bg-surface p-6 shadow-card lg:col-span-2">
      <h2 className="text-[15px] font-semibold text-ink">
        Stripe Connect (platform)
      </h2>
      <p className="mt-2 text-sm text-text-2">
        These settings are for <strong>your</strong> Silkview Connect application.
        Customers connect their own Stripe accounts via OAuth — not your platform
        account.
      </p>
      {error && (
        <p className="mt-3 text-sm text-red">{error}</p>
      )}
      {data && (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-3">Credentials paired</dt>
            <dd className="font-medium text-ink">
              {data.paired ? 'Yes' : 'No — fix env vars'}
            </dd>
          </div>
          <div>
            <dt className="text-text-3">Mode</dt>
            <dd className="font-medium text-ink">{data.secretMode}</dd>
          </div>
          <div>
            <dt className="text-text-3">Connect API enabled</dt>
            <dd className="font-medium text-ink">
              {data.connectApiEnabled ? 'Yes' : 'No — complete Connect setup in Stripe Dashboard'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-text-3">OAuth callback URL</dt>
            <dd className="font-mono text-xs text-ink break-all">
              {data.redirectUri}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-text-3">Status</dt>
            <dd className="text-text-2">{data.hint}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
