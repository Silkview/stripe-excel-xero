'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { getMfaStatus } from '@/lib/auth/mfa';
import {
  needsMfaEnrollmentSetup,
} from '@/lib/auth/mfa-enrollment';
import { navigateExcelAuth } from '@/lib/auth/excel-navigation';
import { navigateExcelFinish } from '@/lib/auth/excel-handoff-client';
import {
  signInWithPassword,
  syncBrowserSessionToServer,
} from '@/lib/auth/credentials';
import MfaEnrollStep from '@/components/onboarding/MfaEnrollStep';
import ResendConfirmation from '@/components/auth/ResendConfirmation';
import AuthShell from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

type Screen = 'login' | 'mfa' | 'checking';

async function auditLogin(data: Record<string, unknown>) {
  try {
    await fetch('/api/auth/login-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    // Non-fatal
  }
}

async function fetchOnboardingStatus() {
  const statusRes = await fetch('/api/onboarding/status', {
    credentials: 'include',
  });
  return statusRes.json().catch(() => null);
}

async function continueExcelAuth(source: string, handoff: string | null) {
  const supabase = createSupabaseBrowser();
  const statusJson = await fetchOnboardingStatus();

  if (statusJson?.success && statusJson.data?.needsOnboarding) {
    await auditLogin({
      location: 'excel:continue',
      message: 'navigate onboarding',
      data: { source, needsOnboarding: true },
      runId: 'post-fix-inline-mfa',
    });
    navigateExcelAuth('/onboarding?return=excel', handoff);
    return;
  }

  const mfa = await getMfaStatus(supabase);
  if (mfa.needsVerification) {
    await auditLogin({
      location: 'excel:continue',
      message: 'navigate mfa verify',
      data: { source },
      runId: 'post-fix-inline-mfa',
    });
    navigateExcelAuth('/auth/mfa/verify?return=excel', handoff);
    return;
  }

  if (await needsMfaEnrollmentSetup(supabase)) {
    await auditLogin({
      location: 'excel:continue',
      message: 'show inline mfa',
      data: { source },
      runId: 'post-fix-inline-mfa',
    });
    return 'mfa' as const;
  }

  await auditLogin({
    location: 'excel:continue',
    message: 'navigate excel-finish',
    data: { source },
    runId: 'post-fix-inline-mfa',
  });
  await navigateExcelFinish(handoff);
  return 'done' as const;
}

function ExcelAuthInner() {
  const searchParams = useSearchParams();
  const forceMfa = searchParams.get('step') === 'mfa';
  const handoff = searchParams.get('handoff');

  const [screen, setScreen] = useState<Screen>(forceMfa ? 'checking' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!forceMfa) return;
    (async () => {
      const supabase = createSupabaseBrowser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setScreen('login');
        setError('Sign in first, then complete MFA setup.');
        return;
      }
      await syncBrowserSessionToServer(session);
      const next = await continueExcelAuth('url-step-mfa', handoff);
      if (next === 'mfa') setScreen('mfa');
    })();
  }, [forceMfa, handoff]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowser();
    const result = await signInWithPassword(supabase, email, password);

    if (!result.ok) {
      setLoading(false);
      setError(result.message);
      return;
    }

    try {
      await syncBrowserSessionToServer(result.session);
      const next = await continueExcelAuth('password-login', handoff);
      if (next === 'mfa') {
        setScreen('mfa');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Account setup failed. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const finishMfa = useCallback(() => {
    void navigateExcelFinish(handoff);
  }, [handoff]);

  if (screen === 'checking') {
    return (
      <AuthShell title="Secure your account" subtitle="Loading…">
        <p className="text-sm text-text-2">Loading…</p>
      </AuthShell>
    );
  }

  if (screen === 'mfa') {
    return (
      <AuthShell
        title="Secure your account"
        subtitle="Set up two-factor authentication (recommended). You can skip and continue to Excel."
      >
        <MfaEnrollStep
          verifyReturnPath="/auth/mfa/verify?return=excel"
          onComplete={finishMfa}
          onSkip={finishMfa}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Sign in to Excel"
      subtitle="Connect Stripe and Xero from your workbook."
    >
      <form onSubmit={handlePasswordLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <ResendConfirmation email={email} />
        <a
          href="/auth/forgot-password"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-sm text-stripe font-medium hover:underline"
        >
          Forgot password?
        </a>
      </form>
    </AuthShell>
  );
}

export default function ExcelAuthPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Sign in to Excel" subtitle="Loading…">
          <p className="text-sm text-text-2">Loading…</p>
        </AuthShell>
      }
    >
      <ExcelAuthInner />
    </Suspense>
  );
}
