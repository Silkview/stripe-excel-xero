import { useEffect, useRef } from 'react';
import type { OnboardingState } from '../hooks/useOnboarding';
import { useXeroAuth } from '../hooks/useXeroAuth';
import { useStripeAuth } from '../hooks/useStripeAuth';
import Header from './ui/Header';
import Button from './ui/Button';

type Props = {
  onboarding: OnboardingState;
  onFinished: () => void;
  onRefresh?: () => void;
  onSignOut?: () => void;
  refreshing?: boolean;
};

export default function OnboardingPanel({
  onboarding,
  onFinished,
  onRefresh,
  onSignOut,
  refreshing = false,
}: Props) {
  const apiReady = !!onboarding.workspaceId;
  const xeroAuth = useXeroAuth(apiReady);
  const stripeAuth = useStripeAuth(apiReady);

  const maxStripe =
    onboarding.limits?.maxStripeConnectionsPerWorkspace ?? 1;
  const canAddStripe = onboarding.workspaceStripeCount < maxStripe;

  const refreshOnboarding = onboarding.refresh;
  const wasXeroConnected = useRef(false);
  const wasStripeConnected = useRef(false);

  useEffect(() => {
    const xeroNow = xeroAuth.status.connected;
    const stripeNow = stripeAuth.status.connected;
    const xeroJustConnected = xeroNow && !wasXeroConnected.current;
    const stripeJustConnected = stripeNow && !wasStripeConnected.current;
    wasXeroConnected.current = xeroNow;
    wasStripeConnected.current = stripeNow;

    if (xeroJustConnected || stripeJustConnected) {
      void refreshOnboarding({ silent: true });
    }
  }, [
    xeroAuth.status.connected,
    stripeAuth.status.connected,
    refreshOnboarding,
  ]);

  const handleFinish = async () => {
    const ok = await onboarding.finish();
    if (ok) {
      onFinished();
    }
  };

  if (onboarding.loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
        <Header
          signedIn
          refreshing={refreshing}
          onRefresh={onRefresh}
          onSignOut={onSignOut}
        />
        <p className="text-sm text-text-2 p-4">Loading setup…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
      <Header
        signedIn
        refreshing={refreshing}
        onRefresh={onRefresh}
        onSignOut={onSignOut}
      />
      <div className="p-4 flex-1">
      <h2 className="text-lg font-semibold mt-2">Connect your accounts</h2>
      <p className="text-sm text-text-2 mt-1 mb-4">
        Your workspace is ready. Connect <strong>your</strong> Xero organisation
        and <strong>your</strong> Stripe account — Silkview only uses them for
        this workspace, not for other customers.
      </p>

      {onboarding.error && (
        <p className="text-xs text-warn-text mb-3">{onboarding.error}</p>
      )}

      <section className="mb-4 rounded border border-border bg-surface p-3">
        <h3 className="text-sm font-semibold mb-2">1. Connect Xero</h3>
        <p className="text-xs text-text-2 mb-2">
          One Xero organisation per workspace (sets your base currency).
        </p>
        {xeroAuth.status.connected ? (
          <p className="text-xs text-success-text">
            Connected: {xeroAuth.status.tenantName ?? 'Xero'}
          </p>
        ) : (
          <Button
            variant="xero"
            disabled={xeroAuth.loading || xeroAuth.waitingForBrowser}
            onClick={() => void xeroAuth.connect()}
          >
            {xeroAuth.waitingForBrowser
              ? 'Waiting…'
              : xeroAuth.loading
                ? 'Connecting…'
                : 'Connect Xero'}
          </Button>
        )}
        {xeroAuth.error && (
          <p className="text-xs text-warn-text mt-2">{xeroAuth.error}</p>
        )}
      </section>

      <section className="mb-4 rounded border border-border bg-surface p-3">
        <h3 className="text-sm font-semibold mb-2">2. Connect Stripe</h3>
        <p className="text-xs text-text-2 mb-2">
          {onboarding.workspaceStripeCount} of {maxStripe} Stripe account
          {maxStripe > 1 ? 's' : ''} for this workspace.
        </p>
        <p className="text-xs text-text-3 mb-2">
          Opens Stripe so you sign in with the account you want to sync (use the
          same test/live mode as your Silkview environment).
        </p>
        {stripeAuth.status.connected ? (
          <p className="text-xs text-success-text mb-2">
            At least one Stripe account connected
          </p>
        ) : null}
        {canAddStripe && (
          <Button
            variant="primary"
            disabled={stripeAuth.loading || stripeAuth.waitingForBrowser}
            onClick={() => void stripeAuth.connect('login')}
          >
            {stripeAuth.loading || stripeAuth.waitingForBrowser
              ? 'Connecting…'
              : onboarding.hasStripe
                ? 'Reconnect Stripe'
                : 'Connect Stripe'}
          </Button>
        )}
        {!canAddStripe && onboarding.hasStripe && (
          <p className="text-xs text-text-3">
            Stripe limit reached for your plan.
          </p>
        )}
        {stripeAuth.error && (
          <p className="text-xs text-warn-text mt-2">{stripeAuth.error}</p>
        )}
      </section>

      <Button
        variant="primary"
        disabled={!onboarding.hasXero || !onboarding.hasStripe}
        onClick={() => void handleFinish()}
      >
        Finish setup
      </Button>
      </div>
    </div>
  );
}
