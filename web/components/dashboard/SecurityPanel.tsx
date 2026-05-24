'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import {
  getMfaStatus,
  unenrollVerifiedTotp,
  type MfaStatus,
} from '@/lib/auth/mfa';
import Button from '@/components/ui/Button';
import { DashboardModal, PageHeader, useDashboard } from './dashboard-ui';
import { getAddinManifestUrl } from '@/lib/excel-launch';

export default function SecurityPanel() {
  const ctx = useDashboard();
  const [mfa, setMfa] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowser();
        const status = await getMfaStatus(supabase);
        if (!cancelled) setMfa(status);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const removeMfa = async () => {
    setRemoving(true);
    setRemoveError(null);
    try {
      const supabase = createSupabaseBrowser();
      await unenrollVerifiedTotp(supabase);
      const status = await getMfaStatus(supabase);
      setMfa(status);
      setRemoveOpen(false);
    } catch (err) {
      setRemoveError(
        err instanceof Error ? err.message : 'Could not remove MFA.'
      );
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Security & MFA"
        subtitle="Protect your account and review how you connect to Excel."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[11px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">
            Two-factor authentication
          </h2>
          {loading ? (
            <p className="mt-2 text-sm text-text-2">Loading MFA status…</p>
          ) : mfa?.hasVerifiedTotp ? (
            <>
              <p className="mt-2 text-sm text-green">
                MFA is enabled on your account.
              </p>
              <Button
                variant="secondary"
                className="mt-4 !border-red/30 !text-red hover:!bg-red-light"
                onClick={() => setRemoveOpen(true)}
              >
                Remove MFA
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-text-2">
                Add an authenticator app for an extra layer of security when
                signing in.
              </p>
              <Button
                href="/auth/mfa/enroll"
                variant="primary"
                className="mt-4 !bg-accent"
              >
                Set up MFA
              </Button>
            </>
          )}
        </section>

        <section className="rounded-[11px] border border-border bg-surface p-6 shadow-card">
          <h2 className="text-[15px] font-semibold text-ink">Password</h2>
          <p className="mt-2 text-sm text-text-2">
            Reset your password via the sign-in page. A reset link is sent to{' '}
            <span className="font-medium text-ink">{ctx.email}</span>.
          </p>
          <Button href="/auth/login" variant="secondary" className="mt-4">
            Go to sign in
          </Button>
        </section>

        <section className="rounded-[11px] border border-border bg-surface p-6 shadow-card lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-ink">Active sessions</h2>
          <p className="mt-2 text-sm text-text-2">
            Session management across devices is not available yet. You are signed
            in on this browser only.
          </p>
          <div className="mt-4 rounded-lg border border-border bg-bg px-4 py-3 text-sm">
            <span className="font-medium text-ink">Current device</span>
            <span className="ml-2 text-text-3">— this session</span>
          </div>
        </section>

        <section className="rounded-[11px] border border-xero/30 bg-xero-light/30 p-6 lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-xero-text">
            Excel add-in security
          </h2>
          <p className="mt-2 text-sm text-text-2">
            OAuth tokens for Xero and Stripe are stored encrypted and scoped per
            workspace. Connect only from the sideloaded add-in.
          </p>
          <a
            href={getAddinManifestUrl()}
            className="mt-3 inline-block text-sm text-accent underline"
            target="_blank"
            rel="noreferrer"
          >
            View add-in manifest
          </a>
        </section>
      </div>

      <DashboardModal
        open={removeOpen}
        title="Remove MFA"
        danger
        onClose={() => setRemoveOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="!bg-red hover:!bg-red/90"
              onClick={() => void removeMfa()}
              disabled={removing}
            >
              {removing ? 'Removing…' : 'Remove MFA'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-2">
          You&apos;ll need to set up MFA again to re-enable two-factor
          authentication.
        </p>
        {removeError && <p className="text-sm text-red">{removeError}</p>}
      </DashboardModal>
    </>
  );
}

