'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { formatAuthError, syncBrowserSessionToServer } from '@/lib/auth/credentials';
import AuthCard from '@/components/ui/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let cancelled = false;
    let finished = false;

    const finish = async (session: Session) => {
      if (cancelled || finished) return;
      finished = true;
      try {
        await syncBrowserSessionToServer(session);
      } catch {
        // Non-fatal: the form still works against the browser client.
      }
      if (cancelled) return;
      setReady(true);
      setLoading(false);
    };

    const showError = (message: string) => {
      if (cancelled || finished) return;
      finished = true;
      setError(message);
      setLoading(false);
    };

    const { data: subData } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          void finish(session);
        }
      }
    );

    (async () => {
      const code = searchParams.get('code');
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (code) {
        const { error: exchangeErr } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) {
          showError(formatAuthError(exchangeErr));
          return;
        }
      } else if (tokenHash && type === 'recovery') {
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        if (verifyErr) {
          showError(formatAuthError(verifyErr));
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        void finish(session);
        return;
      }

      // No code/token_hash and no session yet. `detectSessionInUrl: true`
      // may still be processing a hash-fragment recovery URL — wait briefly
      // for the PASSWORD_RECOVERY event, then fall back to an invalid-link
      // message.
      setTimeout(async () => {
        if (finished || cancelled) return;
        const { data: { session: late } } = await supabase.auth.getSession();
        if (late) {
          void finish(late);
          return;
        }
        showError(
          'This reset link is invalid or has expired. Request a new one from the sign-in page.'
        );
      }, 700);
    })();

    return () => {
      cancelled = true;
      subData.subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const supabase = createSupabaseBrowser();
    const { error: updateErr } = await supabase.auth.updateUser({ password });

    if (updateErr) {
      setSubmitting(false);
      setError(formatAuthError(updateErr));
      return;
    }

    await supabase.auth.signOut().catch(() => {});
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => {});

    setSubmitting(false);
    router.replace('/auth/login?reset=success');
  };

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Enter a new password for your account."
      footer={
        <>
          <Link href="/auth/login" className="text-stripe font-medium hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {loading ? (
        <p className="text-sm text-text-2">Verifying reset link…</p>
      ) : !ready ? (
        <Alert variant="error">{error ?? 'Could not verify reset link.'}</Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <Alert variant="error">{error}</Alert>}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Choose a new password" subtitle="Loading…">
          <p className="text-sm text-text-2">Loading…</p>
        </AuthCard>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
