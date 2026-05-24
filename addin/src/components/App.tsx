import { useState, type ReactNode } from 'react';
import Header from './ui/Header';
import WorkspaceBar from './ui/WorkspaceBar';
import SetupStrip from './SetupStrip';
import ConnectionsSection from './ConnectionsSection';
import StepTabs, { type StepTabId } from './ui/StepTabs';
import StripePanel from './StripePanel';
import BuildPanel from './BuildPanel';
import PushPanel from './PushPanel';
import SetupPanel from './SetupPanel';
import Button from './ui/Button';
import ResultBar from './ui/ResultBar';
import { useAuth } from '../hooks/useAuth';
import { useOnboarding } from '../hooks/useOnboarding';
import OnboardingPanel from './OnboardingPanel';
import { useWorkspace } from '../hooks/useWorkspace';
import { useStripeAuth } from '../hooks/useStripeAuth';
import { useXeroAuth } from '../hooks/useXeroAuth';
import { useDefaultCurrency } from '../hooks/useDefaultCurrency';
import { useStripeAccountSelection } from '../hooks/useStripeAccountSelection';
import { useSetupActions } from '../hooks/useSetupActions';
import { getAppUrl } from '../utils/api';
import { clearStripeAccountId } from '../utils/session';
import NameStripeConnectionModal from './NameStripeConnectionModal';
import BillingRequiredPanel from './BillingRequiredPanel';

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans text-ink">
      <Header />
      {children}
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  const onboarding = useOnboarding(auth.signedIn);
  const workspace = useWorkspace(
    auth.signedIn && !onboarding.needsSetup && !onboarding.needsWebProvision,
    {
      onAuthExpired: auth.signOut,
    }
  );
  const apiReady = auth.signedIn && !onboarding.needsSetup && workspace.ready;
  const stripeAuth = useStripeAuth(apiReady, workspace.workspaceId);
  const xeroAuth = useXeroAuth(apiReady, workspace.workspaceId);
  const { currency, ready: currencyReady } = useDefaultCurrency(xeroAuth.status);
  const stripeConnections = stripeAuth.status.connections ?? [];
  const stripeSelection = useStripeAccountSelection(
    stripeConnections,
    stripeAuth.status.defaultStripeAccountId
  );
  const setupActions = useSetupActions({
    xeroConnected: xeroAuth.status.connected && !xeroAuth.needsReconnect,
    workspaceName:
      workspace.workspaces.find((w) => w.id === workspace.workspaceId)?.name,
    baseCurrency: currency,
  });

  const [activeTab, setActiveTab] = useState<StepTabId>('pull');
  const [showSetup, setShowSetup] = useState(false);
  const [tabBeforeSetup, setTabBeforeSetup] = useState<StepTabId>('pull');
  const [done, setDone] = useState<Partial<Record<StepTabId, boolean>>>({});

  const openSetup = () => {
    setTabBeforeSetup(activeTab);
    setShowSetup(true);
  };

  const closeSetup = () => {
    setShowSetup(false);
    setActiveTab(tabBeforeSetup);
  };

  const handleWorkspaceChange = (id: string) => {
    workspace.selectWorkspace(id);
    clearStripeAccountId();
    stripeAuth.setError(null);
    xeroAuth.setError(null);
    void stripeAuth.refresh();
    void xeroAuth.refresh();
  };

  const workspaceName =
    workspace.workspaces.find((w) => w.id === workspace.workspaceId)?.name ??
    'this workspace';

  const manualJournalPostMode =
    workspace.workspaces.find((w) => w.id === workspace.workspaceId)
      ?.manualJournalPostMode ?? 'draft_and_post';

  const workspaceBarProps =
    workspace.ready && workspace.workspaces.length > 0
      ? {
          workspaces: workspace.workspaces,
          workspaceId: workspace.workspaceId,
          onWorkspaceChange: handleWorkspaceChange,
          loading: workspace.loading,
        }
      : null;

  const needsSignIn = !auth.signedIn || workspace.sessionExpired;

  if (needsSignIn) {
    return (
      <AppShell>
        {workspaceBarProps && <WorkspaceBar {...workspaceBarProps} />}
        <div className="p-3.5 flex-1">
          <p className="text-sm text-ink-2 mb-3">
            {workspace.sessionExpired
              ? 'Your session expired. Sign in again to sync Stripe and Xero data.'
              : 'Sign in to sync Stripe and Xero data in this workbook.'}
          </p>
          <Button variant="build" onClick={auth.signIn} disabled={auth.loading}>
            {auth.loading ? 'Signing in…' : 'Sign in'}
          </Button>
          {auth.error && (
            <p className="text-xs text-warn-text mt-2">{auth.error}</p>
          )}
        </div>
      </AppShell>
    );
  }

  if (onboarding.loading || onboarding.provisioning) {
    return (
      <AppShell>
        {workspaceBarProps && <WorkspaceBar {...workspaceBarProps} />}
        <p className="text-sm text-ink-2 p-3.5">
          {onboarding.provisioning ? 'Creating your account…' : 'Loading…'}
        </p>
      </AppShell>
    );
  }

  if (onboarding.needsWebProvision) {
    const onboardingUrl = `${getAppUrl()}/onboarding`;
    const isSupabaseSchemaConfig =
      onboarding.error?.includes('core" schema') ||
      onboarding.error?.includes('Exposed schemas') ||
      onboarding.error?.includes('Invalid schema');
    return (
      <AppShell>
        {workspaceBarProps && <WorkspaceBar {...workspaceBarProps} />}
        <div className="p-3.5 flex-1">
          <h2 className="text-lg font-semibold">
            {isSupabaseSchemaConfig
              ? 'Supabase configuration required'
              : 'Account setup needed'}
          </h2>
          <p className="text-sm text-ink-2 mt-2 mb-4">
            {isSupabaseSchemaConfig
              ? 'The app database schema is not exposed on your Supabase project, so accounts and workspaces cannot be created. Fix this in the Supabase Dashboard, then retry.'
              : 'We could not create your workspace automatically. Open onboarding in your browser to finish setup, then return here to connect Xero and Stripe.'}
          </p>
          {onboarding.error && (
            <p className="text-xs text-warn-text mb-3">{onboarding.error}</p>
          )}
          {!isSupabaseSchemaConfig && (
            <Button
              variant="build"
              onClick={() => {
                window.open(onboardingUrl, '_blank');
              }}
            >
              Open web onboarding
            </Button>
          )}
          <Button
            variant="ghost"
            className="mt-2"
            onClick={() => void onboarding.refresh()}
          >
            Retry
          </Button>
        </div>
      </AppShell>
    );
  }

  if (onboarding.needsSetup) {
    return (
      <OnboardingPanel
        onboarding={onboarding}
        onFinished={() => {
          void onboarding.refresh({ silent: true });
          void workspace.refresh();
        }}
      />
    );
  }

  const billingBlocked =
    onboarding.billingAccess !== 'active' || onboarding.needsDowngradeSelection;

  if (billingBlocked) {
    return (
      <AppShell>
        {workspaceBarProps && <WorkspaceBar {...workspaceBarProps} />}
        <BillingRequiredPanel
          billingUrl={onboarding.billingUrl}
          billingAccess={onboarding.billingAccess}
          needsDowngradeSelection={onboarding.needsDowngradeSelection}
        />
      </AppShell>
    );
  }

  if (!workspace.ready) {
    return (
      <AppShell>
        {workspaceBarProps && <WorkspaceBar {...workspaceBarProps} />}
        <div className="p-3.5 flex-1">
          <p className="text-sm text-ink-2 mb-3">
            {workspace.loading
              ? 'Loading workspace…'
              : (workspace.error ?? 'No workspace available.')}
          </p>
          {!workspace.loading && workspace.error && (
            <Button variant="ghost" onClick={auth.signOut} className="mt-2">
              Sign out
            </Button>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {workspaceBarProps && <WorkspaceBar {...workspaceBarProps} />}

      {showSetup ? (
        <SetupPanel
          xeroConnected={
            xeroAuth.status.connected && !xeroAuth.needsReconnect
          }
          workspaceName={workspaceName}
          tenantName={xeroAuth.status.tenantName}
          baseCurrency={currency}
          onBack={closeSetup}
        />
      ) : (
        <>
          <SetupStrip
            onSetupSheets={() => void setupActions.setupSheets()}
            onRefreshXero={() => void setupActions.refreshXero()}
            onAdvancedSetup={openSetup}
            loadingSheets={setupActions.loading}
            loadingRefresh={setupActions.refreshing}
            xeroConnected={
              xeroAuth.status.connected && !xeroAuth.needsReconnect
            }
          />

          <ConnectionsSection
            stripe={stripeAuth.status}
            xero={xeroAuth.status}
            stripeLoading={stripeAuth.loading}
            xeroLoading={xeroAuth.loading}
            stripeWaiting={stripeAuth.waitingForBrowser}
            xeroWaiting={xeroAuth.waitingForBrowser}
            onConnectStripe={() => void stripeAuth.connect('login')}
            onConnectAnotherStripe={
              stripeAuth.canAddAnother
                ? () => void stripeAuth.connect('login')
                : undefined
            }
            canAddAnotherStripe={stripeAuth.canAddAnother}
            onConnectXero={() => void xeroAuth.connect()}
            xeroNeedsReconnect={xeroAuth.needsReconnect}
            defaultCurrency={currencyReady ? currency : undefined}
            selectedAccountIds={stripeSelection.selectedAccountIds}
            onToggleAccount={stripeSelection.toggleAccount}
            onSelectAllAccounts={stripeSelection.selectAllAccounts}
          />

          {(stripeAuth.error || xeroAuth.error) && (
            <div className="mx-3.5 mt-2 text-xs text-warn-text bg-warn-bg px-2.5 py-2 rounded-lg border border-[#fde68a]">
              {stripeAuth.error || xeroAuth.error}
            </div>
          )}

          {setupActions.statusMessage && !showSetup && (
            <div className="px-3.5">
              <ResultBar variant={setupActions.statusError ? 'warn' : 'success'}>
                {setupActions.statusMessage}
              </ResultBar>
            </div>
          )}

          <StepTabs active={activeTab} onChange={setActiveTab} done={done} />

          <div className="flex-1 overflow-y-auto bg-bg">
            {activeTab === 'pull' && (
              <StripePanel
                stripeConnected={stripeAuth.status.connected}
                selectedList={stripeSelection.selectedList}
                currencyReady={currencyReady}
                defaultCurrency={currency}
                onPulled={() => setDone((d) => ({ ...d, pull: true }))}
              />
            )}
            {activeTab === 'build' && (
              <BuildPanel
                currencyReady={currencyReady}
                defaultCurrency={currency}
                onBuilt={() => setDone((d) => ({ ...d, build: true }))}
              />
            )}
            {activeTab === 'push' && (
              <PushPanel
                xeroConnected={xeroAuth.status.connected}
                currencyReady={currencyReady}
                defaultCurrency={currency}
                manualJournalPostMode={manualJournalPostMode}
              />
            )}
          </div>
        </>
      )}

      {stripeAuth.pendingName && (
        <NameStripeConnectionModal
          suggestedName={stripeAuth.pendingName.suggestedName}
          saving={stripeAuth.savingName}
          onSave={(name) => void stripeAuth.saveConnectionName(name)}
          onSkip={stripeAuth.dismissNamePrompt}
        />
      )}
    </AppShell>
  );
}
