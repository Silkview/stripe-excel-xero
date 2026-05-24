'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import {
  resolvePostAuthRedirect,
  safeReturnPath,
} from '@/lib/auth/client-post-auth-redirect';
import { PRODUCT_NAME } from '@stripesync/shared/brand';
import { navigateExcelAuth } from '@/lib/auth/excel-navigation';
import {
  signInWithPassword,
  syncBrowserSessionToServer,
} from '@/lib/auth/credentials';
import AuthCard from '@/components/ui/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

type ExcelAuthMode = 'password' | 'magic';

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const excelMode = searchParams.get('return') === 'excel';
  const resetSuccess = searchParams.get('reset') === 'success';
  const returnPath = excelMode ? null : safeReturnPath(searchParams.get('return'));

  const [excelAuthMode, setExcelAuthMode] = useState<ExcelAuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (excelMode) return;
    let cancelled = false;
    const supabase = createSupabaseBrowser();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const path = await resolvePostAuthRedirect(supabase, { returnPath });
      if (!cancelled && path && !path.startsWith('/auth/login')) {
        router.replace(path);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [excelMode, returnPath, router]);

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

      const path = await resolvePostAuthRedirect(supabase, {
        excelMode,
        returnPath,
      });
      if (excelMode) {
        navigateExcelAuth(path);
      } else {
        router.push(path);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sign-in failed. Try again.'
      );
    } finally {
      setLoading(false);
    }
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
          : `Welcome back to ${PRODUCT_NAME}.`
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
      {!excelMode && resetSuccess && (
        <div className="mb-4">
          <Alert variant="success">
            Password updated. Sign in with your new password.
          </Alert>
        </div>
      )}

      {!excelMode && (
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
          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-stripe font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          {error && <Alert variant="error">{error}</Alert>}
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      )}

      {excelMode && (
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
