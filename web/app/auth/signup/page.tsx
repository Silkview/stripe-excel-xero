'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { resolvePostAuthRedirect } from '@/lib/auth/client-post-auth-redirect';
import {
  formatAuthError,
  normalizeAuthEmail,
  syncBrowserSessionToServer,
} from '@/lib/auth/credentials';
import type { PlanCode } from '@/lib/plans/types';
import PlanPricingGrid from '@/components/plans/PlanPricingGrid';
import AuthCard from '@/components/ui/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import DeploymentDeskNote from '@/components/enterprise/DeploymentDeskNote';
import { ENTERPRISE_PATH } from '@/lib/support';

const VALID_PLANS: PlanCode[] = ['free', 'pro', 'firm'];

function signupAfterCard(wide = false) {
  return (
    <div className={`mt-4 w-full ${wide ? 'max-w-5xl' : 'max-w-md'}`}>
      <DeploymentDeskNote />
      <p className="mt-3 text-center text-sm text-text-2">
        <Link href={ENTERPRISE_PATH} className="text-stripe font-medium hover:underline">
          Learn more about Firm &amp; Enterprise deployment →
        </Link>
      </p>
    </div>
  );
}

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = (searchParams.get('plan') as PlanCode) || 'free';
  const [step, setStep] = useState<'plan' | 'account'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>(
    VALID_PLANS.includes(initialPlan) ? initialPlan : 'free'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountName, setAccountName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!workspaceName.trim()) {
      setError('Workspace name is required.');
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowser();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const normalizedEmail = normalizeAuthEmail(email);

    const { data, error: err } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          plan_code: selectedPlan,
          account_name: accountName.trim() || undefined,
          workspace_name: workspaceName.trim(),
        },
      },
    });

    setLoading(false);

    // #region agent log
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'aa61bb',
      },
      body: JSON.stringify({
        sessionId: 'aa61bb',
        location: 'web/app/auth/signup/page.tsx:handleSubmit',
        hypothesisId: 'H_SIGNUP_EMAIL',
        message: 'signup:response',
        data: {
          hasError: !!err,
          errorCode: err?.code ?? null,
          errorStatus: err?.status ?? null,
          errorMessage: err?.message ?? null,
          hasUser: !!data?.user,
          userId: data?.user?.id ?? null,
          identitiesField:
            data?.user?.identities === undefined
              ? 'undefined'
              : data?.user?.identities === null
                ? 'null'
                : 'array',
          identityCount: data?.user?.identities?.length ?? null,
          identityProviders:
            data?.user?.identities?.map((i) => i.provider) ?? null,
          hasSession: !!data?.session,
          emailConfirmedAt: data?.user?.email_confirmed_at ?? null,
          confirmationSentAt:
            (data?.user as { confirmation_sent_at?: string } | null)
              ?.confirmation_sent_at ?? null,
          createdAt: data?.user?.created_at ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (err) {
      setError(formatAuthError(err));
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      setError(
        'An account with this email already exists. Sign in instead.'
      );
      return;
    }

    if (data.session) {
      await syncBrowserSessionToServer(data.session);
      sessionStorage.setItem('signup_plan_code', selectedPlan);
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: selectedPlan,
          accountName: accountName.trim(),
          workspaceName: workspaceName.trim(),
        }),
      });
      const path = await resolvePostAuthRedirect(supabase);
      router.push(path);
      return;
    }

    sessionStorage.setItem('signup_plan_code', selectedPlan);
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We sent a confirmation link to complete your signup."
        afterCard={signupAfterCard()}
      >
        <Alert variant="success">
          Open the link in <strong>{email}</strong>, then finish setup with your{' '}
          <strong>{selectedPlan}</strong> plan.
        </Alert>
        <p className="mt-3 text-sm text-text-2">
          Already tried signing up? Check spam before submitting again.
        </p>
        <p className="mt-4 text-sm text-text-2">
          <Link href="/auth/login" className="text-stripe font-medium hover:underline">
            Back to sign in
          </Link>
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
        afterCard={signupAfterCard(true)}
        footer={
          <>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-stripe font-medium hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <PlanPricingGrid
          mode="select"
          selectedPlan={selectedPlan}
          onSelect={setSelectedPlan}
          onContinue={() => setStep('account')}
          continueLabel={`Continue with ${selectedPlan}`}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle={`Signing up on the ${selectedPlan} plan.`}
      afterCard={signupAfterCard()}
      footer={
        <>
          <button
            type="button"
            onClick={() => setStep('plan')}
            className="text-stripe font-medium hover:underline text-sm"
          >
            Change plan
          </button>
          {' · '}
          <Link href="/auth/login" className="text-stripe font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Work email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Company or account name"
          type="text"
          required
          autoComplete="organization"
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
        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}

function SignupFallback() {
  return (
    <AuthCard
      title="Choose your plan"
      subtitle="Loading the signup form…"
    >
      <div className="space-y-3">
        <div className="h-10 animate-pulse rounded bg-border/40" />
        <div className="h-10 animate-pulse rounded bg-border/40" />
        <div className="h-10 animate-pulse rounded bg-border/40" />
      </div>
      <noscript>
        <p className="mt-4 text-sm text-text-2">
          Sign-up requires JavaScript. If you cannot enable it, email{' '}
          <a className="text-stripe underline" href="mailto:admin@silkview.org">
            admin@silkview.org
          </a>{' '}
          and we&apos;ll help you get set up.
        </p>
      </noscript>
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupInner />
    </Suspense>
  );
}
