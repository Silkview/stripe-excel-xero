import { useEffect, useRef } from 'react';
import type { OnboardingState } from '../hooks/useOnboarding';
import { useXeroAuth } from '../hooks/useXeroAuth';
import { useStripeAuth } from '../hooks/useStripeAuth';
import TaskPaneShell from './TaskPaneShell';
import Button from './ui/Button';
import {
  useNotifications,
  useNotifyEffect,
} from '../context/NotificationContext';

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
  const { publish, clear } = useNotifications();
  const apiReady = !!onboarding.workspaceId;
  const xeroAuth = useXeroAuth(apiReady);
  const stripeAuth = useStripeAuth(apiReady);

  const maxStripe =
    onboarding.limits?.maxStripeConnectionsPerWorkspace ?? 1;
  const canAddStripe = onboarding.workspaceStripeCount < maxStripe;
  const xeroEnabled = onboarding.xeroFeaturesEnabled;
  const canFinish =
    onboarding.hasStripe && (xeroEnabled ? onboarding.hasXero : true);
  const refreshOnboarding = onboarding.refresh;
  const wasXeroConnected = useRef(false);
  const wasStripeConnected = useRef(false);
  const isFreePlan = onboarding.planCode === 'free';

  useNotifyEffect('onboarding', onboarding.error, 'error');
  useNotifyEffect('onboarding-xero', xeroAuth.error, 'error');
  useNotifyEffect('onboarding-stripe', stripeAuth.error, 'error');

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

  useEffect(() => {
    if (xeroEnabled && xeroAuth.status.connected) {
      publish({
        kind: 'success',
        message: `Connected: ${xeroAuth.status.tenantName ?? 'Xero'}`,
        source: 'onboarding-xero-success',
      });
    } else {
      clear('onboarding-xero-success');
    }
  }, [
    xeroEnabled,
    xeroAuth.status.connected,
    xeroAuth.status.tenantName,
    publish,
    clear,
  ]);

  useEffect(() => {
    if (stripeAuth.status.connected) {
      publish({
        kind: 'success',
        message: 'At least one Stripe account connected.',
        source: 'onboarding-stripe-success',
      });
    } else {
      clear('onboarding-stripe-success');
    }
  }, [stripeAuth.status.connected, publish, clear]);

  useEffect(() => {
    if (!xeroEnabled) {
      publish({
        kind: 'warn',
        message:
          'Xero connect, mapping refresh, and push require Pro or Firm. Use Upgrade now above.',
        source: 'onboarding-xero-gate',
      });
    } else {
      clear('onboarding-xero-gate');
    }
  }, [xeroEnabled, publish, clear]);

  useEffect(() => {
    if (!canAddStripe && onboarding.hasStripe) {
      publish({
        kind: 'warn',
        message: 'Stripe limit reached for your plan.',
        source: 'onboarding-stripe-limit',
      });
    } else {
      clear('onboarding-stripe-limit');
    }
  }, [canAddStripe, onboarding.hasStripe, publish, clear]);

  useEffect(() => {
    return () => {
      clear('onboarding-xero-success');
      clear('onboarding-stripe-success');
      clear('onboarding-xero-gate');
      clear('onboarding-stripe-limit');
    };
  }, [clear]);

  const handleFinish = async () => {
    const ok = await onboarding.finish();
    if (ok) {
      onFinished();
    }
  };

  if (onboarding.loading) {
    return (
      <TaskPaneShell
        signedIn
        refreshing={refreshing}
        onRefresh={onRefresh}
        onSignOut={onSignOut}
        showUpgradeBanner={isFreePlan}
        billingUrl={onboarding.billingUrl}
      >
        <p className="text-sm text-text-2 p-4">Loading setup…</p>
      </TaskPaneShell>
    );
  }

  return (
    <TaskPaneShell
      signedIn
      refreshing={refreshing}
      onRefresh={onRefresh}
      onSignOut={onSignOut}
      showUpgradeBanner={isFreePlan}
      billingUrl={onboarding.billingUrl}
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold mt-2">Connect your accounts</h2>
        <p className="text-sm text-text-2 mt-1 mb-4">
          Your workspace is ready. Connect <strong>your</strong> Stripe account
          {xeroEnabled ? (
            <>
              {' '}
              and <strong>your</strong> Xero organisation
            </>
          ) : null}{' '}
          — Silkview only uses them for this workspace.
        </p>

        <section className="mb-4 rounded border border-border bg-surface p-3">
          <h3 className="text-sm font-semibold mb-2">
            {xeroEnabled ? '1. Connect Xero' : '1. Xero (Pro & Firm)'}
          </h3>
          {xeroEnabled ? (
            <>
              <p className="text-xs text-text-2 mb-2">
                One Xero organisation per workspace (sets your base currency).
              </p>
              {!xeroAuth.status.connected && (
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
            </>
          ) : null}
        </section>

        <section className="mb-4 rounded border border-border bg-surface p-3">
          <h3 className="text-sm font-semibold mb-2">
            {xeroEnabled ? '2. Connect Stripe' : '2. Connect Stripe'}
          </h3>
          <p className="text-xs text-text-2 mb-2">
            {onboarding.workspaceStripeCount} of {maxStripe} Stripe account
            {maxStripe > 1 ? 's' : ''} for this workspace.
          </p>
          <p className="text-xs text-text-3 mb-2">
            Opens Stripe so you sign in with the account you want to sync (use the
            same test/live mode as your Silkview environment).
          </p>
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
        </section>

        <Button
          variant="primary"
          disabled={!canFinish}
          onClick={() => void handleFinish()}
        >
          Finish setup
        </Button>
      </div>
    </TaskPaneShell>
  );
}
