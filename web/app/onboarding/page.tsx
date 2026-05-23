'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { needsMfaEnrollmentSetup } from '@/lib/auth/mfa-enrollment';
import { navigateExcelAuth } from '@/lib/auth/excel-navigation';
import type { PlanCode } from '@/lib/plans/types';
import PlanPricingGrid from '@/components/plans/PlanPricingGrid';
import AuthCard from '@/components/ui/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import MfaEnrollStep from '@/components/onboarding/MfaEnrollStep';

type OnboardingStatus = {
  needsAccountSetup: boolean;
  needsOnboarding: boolean;
  planCode: PlanCode | null;
};

type WizardStep =
  | 'loading'
  | 'plan'
  | 'provisioning'
  | 'provision_form'
  | 'mfa'
  | 'ready';

const VALID_PLANS: PlanCode[] = ['free', 'pro', 'firm'];

function planFromMetadata(raw: unknown): PlanCode | null {
  if (typeof raw === 'string' && VALID_PLANS.includes(raw as PlanCode)) {
    return raw as PlanCode;
  }
  return null;
}

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceMfa = searchParams.get('step') === 'mfa';
  const excelReturn = searchParams.get('return') === 'excel';

  const [step, setStep] = useState<WizardStep>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planCode, setPlanCode] = useState<PlanCode>('free');
  const [planChosen, setPlanChosen] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const initialLoadDone = useRef(false);
  const autoProvisionStarted = useRef(false);

  const mfaVerifyPath = excelReturn
    ? '/auth/mfa/verify?return=excel'
    : '/auth/mfa/verify';

  const runProvision = useCallback(async () => {
    const res = await fetch('/api/onboarding/complete', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planCode,
        accountName: accountName.trim(),
        workspaceName: workspaceName.trim(),
      }),
    });
    const json = await res.json();
    if (!json.success) {
      return { ok: false as const, message: json.error?.message ?? 'Setup failed.' };
    }

    const statusRes = await fetch('/api/onboarding/status', {
      credentials: 'include',
    });
    const statusJson = await statusRes.json();
    if (!statusJson.success || !statusJson.data) {
      return {
        ok: false as const,
        message: 'Workspace created but status could not be verified.',
      };
    }
    if (statusJson.data.needsAccountSetup) {
      return {
        ok: false as const,
        message: 'Workspace was not saved. Try again.',
      };
    }
    return { ok: true as const };
  }, [planCode, accountName, workspaceName]);

  const advanceAfterProvision = useCallback(async () => {
    sessionStorage.removeItem('signup_plan_code');
    const supabase = createSupabaseBrowser();
    if (await needsMfaEnrollmentSetup(supabase)) {
      setStep('mfa');
    } else {
      setStep('ready');
    }
  }, []);

  useEffect(() => {
    if (step === 'ready' && excelReturn) {
      navigateExcelAuth('/auth/excel-complete');
    }
  }, [step, excelReturn]);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const stored = sessionStorage.getItem('signup_plan_code') as PlanCode | null;
      let resolvedPlan: PlanCode = 'free';
      let hasPlan = false;
      if (stored && VALID_PLANS.includes(stored)) {
        resolvedPlan = stored;
        hasPlan = true;
      } else if (user?.user_metadata?.plan_code) {
        const metaPlan = planFromMetadata(user.user_metadata.plan_code);
        if (metaPlan) {
          resolvedPlan = metaPlan;
          hasPlan = true;
        }
      }
      setPlanCode(resolvedPlan);

      if (user?.user_metadata?.account_name) {
        setAccountName(String(user.user_metadata.account_name));
      }
      if (user?.user_metadata?.workspace_name) {
        setWorkspaceName(String(user.user_metadata.workspace_name));
      }

      const res = await fetch('/api/onboarding/status', { credentials: 'include' });
      const json = await res.json();

      if (json.success && json.data) {
        const status = json.data as OnboardingStatus;
        if (!status.needsOnboarding && !forceMfa) {
          if (await needsMfaEnrollmentSetup(supabase)) {
            setStep('mfa');
            return;
          }
          if (excelReturn) {
            navigateExcelAuth('/auth/excel-complete');
          } else {
            router.replace('/dashboard');
          }
          return;
        }
        if (
          !hasPlan &&
          status.planCode &&
          VALID_PLANS.includes(status.planCode)
        ) {
          resolvedPlan = status.planCode;
          setPlanCode(resolvedPlan);
          hasPlan = true;
        }

        if (forceMfa && !status.needsAccountSetup) {
          setStep('mfa');
          return;
        }

        if (status.needsAccountSetup) {
          if (!hasPlan) {
            setStep('plan');
            return;
          }
          if (autoProvisionStarted.current) return;
          autoProvisionStarted.current = true;
          setStep('provisioning');
          const provRes = await fetch('/api/onboarding/complete', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planCode: resolvedPlan }),
          });
          const provJson = await provRes.json();
          if (provJson.success) {
            await advanceAfterProvision();
          } else {
            setError(provJson.error?.message ?? 'Setup failed.');
            setStep('provision_form');
          }
          return;
        }

        if (await needsMfaEnrollmentSetup(supabase)) {
          setStep('mfa');
        } else {
          setStep('ready');
        }
        return;
      }

      if (!hasPlan) {
        setStep('plan');
        return;
      }
      setStep('provision_form');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const handlePlanContinue = () => {
    setPlanChosen(true);
    sessionStorage.setItem('signup_plan_code', planCode);
    setStep('provision_form');
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await runProvision();
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await advanceAfterProvision();
  };

  const startCheckout = async () => {
    setCheckoutLoading(true);
    setError(null);
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planCode }),
    });
    const json = await res.json();
    setCheckoutLoading(false);
    if (json.success && json.data?.url) {
      window.location.href = json.data.url;
    } else {
      setError(json.error?.message ?? 'Could not start checkout.');
    }
  };

  if (step === 'loading' || step === 'provisioning') {
    return (
      <AuthCard title="Set up your account" subtitle="Creating your workspace…">
        <p className="text-sm text-text-2">
          {step === 'provisioning'
            ? 'Saving your account to the database…'
            : 'Loading…'}
        </p>
      </AuthCard>
    );
  }

  if (step === 'plan') {
    return (
      <AuthCard
        wide
        title="Choose your plan"
        subtitle="Pick the tier that fits how you work. You can change billing later for paid plans."
        footer={
          <Link href="/auth/signup" className="text-accent font-medium hover:underline text-sm">
            Back to signup
          </Link>
        }
      >
        <PlanPricingGrid
          mode="select"
          selectedPlan={planCode}
          onSelect={setPlanCode}
          onContinue={handlePlanContinue}
          continueLabel={`Continue with ${planCode}`}
        />
      </AuthCard>
    );
  }

  if (step === 'mfa') {
    return (
      <AuthCard
        title="Secure your account"
        subtitle="Set up two-factor authentication for your account (recommended)."
      >
        <MfaEnrollStep
          verifyReturnPath={mfaVerifyPath}
          onComplete={() => setStep('ready')}
          onSkip={() => setStep('ready')}
        />
      </AuthCard>
    );
  }

  if (step === 'ready') {
    return (
      <AuthCard
        title="You're all set"
        subtitle="Your workspace is ready. Connect Stripe and Xero from the Excel add-in."
      >
        <Alert variant="success">
          Account and workspace created on the{' '}
          <strong className="capitalize">{planCode}</strong> plan.
        </Alert>
        <p className="mt-4 text-sm text-text-2">
          Open Excel, sign in to the add-in, and connect Xero then Stripe to start
          syncing.
        </p>
        {excelReturn ? (
          <Button
            type="button"
            variant="primary"
            className="w-full mt-6"
            onClick={() => navigateExcelAuth('/auth/excel-complete')}
          >
            Return to Excel
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            className="w-full mt-6"
            onClick={() => router.push('/dashboard')}
          >
            Continue to dashboard
          </Button>
        )}
        {!excelReturn && planCode !== 'free' && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-text-2 mb-3">
              Subscribe to {planCode} when you are ready.
            </p>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={checkoutLoading}
              onClick={() => void startCheckout()}
            >
              {checkoutLoading ? 'Redirecting…' : `Subscribe to ${planCode}`}
            </Button>
          </div>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set up your account"
      subtitle={
        planChosen
          ? `Creating your workspace on the ${planCode} plan.`
          : 'We could not auto-create your workspace. Enter details below.'
      }
      footer={
        <button
          type="button"
          onClick={() => setStep('plan')}
          className="text-accent font-medium hover:underline text-sm"
        >
          Change plan
        </button>
      }
    >
      <form onSubmit={handleProvisionSubmit} className="space-y-4">
        <p className="text-sm text-text-2">
          Selected plan: <strong className="capitalize text-text">{planCode}</strong>
        </p>
        <Input
          label="Company or account name"
          type="text"
          required
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
        <Input
          label="First workspace name"
          type="text"
          required
          placeholder="e.g. Main client books"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create workspace'}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Set up your account" subtitle="Loading…">
          <p className="text-sm text-text-2">Loading…</p>
        </AuthCard>
      }
    >
      <OnboardingInner />
    </Suspense>
  );
}
