'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { getMfaStatus } from '@/lib/auth/mfa';
import {
  signInWithPassword,
  syncBrowserSessionToServer,
} from '@/lib/auth/credentials';
import ResendConfirmation from '@/components/auth/ResendConfirmation';
import AuthCard from '@/components/ui/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

type Tab = 'password' | 'excel';
type ExcelAuthMode = 'password' | 'magic';

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const excelMode = searchParams.get('return') === 'excel';
  const defaultTab: Tab = excelMode ? 'excel' : 'password';

  const [tab, setTab] = useState<Tab>(defaultTab);
  const [excelAuthMode, setExcelAuthMode] = useState<ExcelAuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectAfterLogin = useMemo(() => {
    return async () => {
      const supabase = createSupabaseBrowser();
      const status = await getMfaStatus(supabase);
      if (status.needsVerification) {
        router.push('/auth/mfa/verify');
      } else if (!status.hasVerifiedTotp) {
        router.push('/auth/mfa/enroll');
      } else {
        router.push('/dashboard');
      }
    };
  }, [router]);

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

    await syncBrowserSessionToServer(result.session);

    if (excelMode) {
      try {
        await fetch('/api/auth/ensure-account', {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${result.session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        });
      } catch {
        // Webhook may have provisioned; non-fatal
      }
      setLoading(false);
      router.push('/auth/excel-complete');
      return;
    }

    try {
      await fetch('/api/auth/ensure-account', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${result.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
      });
    } catch {
      // Webhook may have provisioned; non-fatal
    }

    setLoading(false);
    await redirectAfterLogin();
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowser();
    const redirectTo = `${window.location.origin}/auth/callback?return=excel`;
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setMagicSent(true);
  };

  return (
    <AuthCard
      title="Sign in"
      subtitle={
        excelMode
          ? 'Sign in to connect Stripe and Xero from the Excel add-in.'
          : 'Welcome back to Silkview Sync.'
      }
      footer={
        excelMode ? undefined : (
          <>
            New here?{' '}
            <Link href="/auth/signup" className="text-stripe font-medium hover:underline">
              Create an account
            </Link>
          </>
        )
      }
    >
      {!excelMode && (
        <div className="mb-6 flex rounded-sm border border-border p-0.5 bg-bg">
          <button
            type="button"
            onClick={() => setTab('password')}
            className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors ${
              tab === 'password'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-2 hover:text-text'
            }`}
          >
            Email &amp; password
          </button>
          <button
            type="button"
            onClick={() => setTab('excel')}
            className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors ${
              tab === 'excel'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-2 hover:text-text'
            }`}
          >
            Excel add-in
          </button>
        </div>
      )}

      {tab === 'password' && !excelMode && (
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
        </form>
      )}

      {(tab === 'excel' || excelMode) && (
        <>
          {magicSent ? (
            <Alert variant="success">
              Check your inbox and open the magic link. Return to Excel when done.
            </Alert>
          ) : excelAuthMode === 'password' ? (
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
              <button
                type="button"
                onClick={() => {
                  setExcelAuthMode('magic');
                  setError(null);
                }}
                className="w-full text-sm text-stripe font-medium hover:underline"
              >
                Send magic link instead
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <p className="text-sm text-text-2">
                We&apos;ll email you a one-time link. Open it in this window to return
                to Excel.
              </p>
              <Input
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {error && <Alert variant="error">{error}</Alert>}
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send magic link'}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setExcelAuthMode('password');
                  setError(null);
                }}
                className="w-full text-sm text-text-2 hover:text-text"
              >
                Sign in with password instead
              </button>
            </form>
          )}
        </>
      )}
    </AuthCard>
  );
}

export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Sign in" subtitle="Loading…">
          <p className="text-sm text-text-2">Loading…</p>
        </AuthCard>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
