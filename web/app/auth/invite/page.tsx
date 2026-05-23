'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { resolvePostAuthRedirect } from '@/lib/auth/client-post-auth-redirect';
import { inviteReturnPath } from '@/lib/auth/pending-invite';
import {
  formatAuthError,
  normalizeAuthEmail,
  syncBrowserSessionToServer,
} from '@/lib/auth/credentials';
import AuthCard from '@/components/ui/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

type InvitePreview = {
  email: string;
  accountName: string;
  inviterName: string;
  workspaceNames: string[];
  role: string;
};

type PageStatus =
  | 'loading'
  | 'invalid'
  | 'signup'
  | 'confirm-email'
  | 'accepting'
  | 'done'
  | 'error'
  | 'has-account'
  | 'email-mismatch';

function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [status, setStatus] = useState<PageStatus>('loading');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const returnUrl = token ? inviteReturnPath(token) : '';

  const acceptInvite = useCallback(async () => {
    const res = await fetch('/api/account/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message ?? 'Could not accept invitation.');
    }
  }, [token]);

  const finishPostAuth = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    const path = await resolvePostAuthRedirect(supabase, {
      returnPath: returnUrl,
    });
    router.replace(path);
  }, [router, returnUrl]);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('Missing invitation token.');
      return;
    }

    const run = async () => {
      const previewRes = await fetch(
        `/api/account/invite/preview?token=${encodeURIComponent(token)}`
      );
      const previewJson = await previewRes.json();
      if (!previewJson.success) {
        setStatus('invalid');
        setMessage(
          previewJson.error?.message ??
            'Invitation is invalid, expired, or already used.'
        );
        return;
      }
      setPreview(previewJson.data as InvitePreview);

      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus('signup');
        return;
      }

      const statusRes = await fetch('/api/onboarding/status', {
        credentials: 'include',
      });
      const statusJson = await statusRes.json();
      if (statusJson.success && statusJson.data?.accountId) {
        setStatus('has-account');
        setMessage(
          'You already have a Silkview account and cannot join another team with this link.'
        );
        return;
      }

      const userEmail = (user.email ?? '').trim().toLowerCase();
      const inviteEmail = previewJson.data.email.trim().toLowerCase();
      if (userEmail !== inviteEmail) {
        setStatus('email-mismatch');
        return;
      }

      setStatus('accepting');
      try {
        await acceptInvite();
        setStatus('done');
        await finishPostAuth();
      } catch (err) {
        setStatus('error');
        setMessage(
          err instanceof Error ? err.message : 'Could not accept invitation.'
        );
      }
    };

    void run();
  }, [token, acceptInvite, finishPostAuth]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview || !token) return;

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    const supabase = createSupabaseBrowser();
    const normalizedEmail = normalizeAuthEmail(preview.email);
    const callbackReturn = encodeURIComponent(returnUrl);
    const redirectTo = `${window.location.origin}/auth/callback?return=${callbackReturn}`;

    const { data, error: err } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { invite_token: token },
      },
    });

    setSubmitting(false);

    if (err) {
      setMessage(formatAuthError(err));
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      setMessage('An account with this email already exists. Sign in instead.');
      return;
    }

    if (data.session) {
      await syncBrowserSessionToServer(data.session);
      setStatus('accepting');
      try {
        await acceptInvite();
        setStatus('done');
        await finishPostAuth();
      } catch (acceptErr) {
        setStatus('error');
        setMessage(
          acceptErr instanceof Error
            ? acceptErr.message
            : 'Could not accept invitation.'
        );
      }
      return;
    }

    setStatus('confirm-email');
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.refresh();
    setStatus('signup');
    setMessage('');
  };

  if (status === 'loading' || status === 'accepting') {
    return (
      <AuthCard
        title="Team invitation"
        subtitle={
          status === 'accepting' ? 'Joining your team…' : 'Loading invitation…'
        }
      >
        <p className="text-sm text-text-2">Please wait…</p>
      </AuthCard>
    );
  }

  if (status === 'invalid' || status === 'error' || status === 'has-account') {
    return (
      <AuthCard title="Team invitation">
        <Alert variant="error">{message}</Alert>
        {status === 'has-account' && (
          <p className="mt-4 text-sm text-text-2">
            <Link href="/dashboard" className="text-stripe font-medium hover:underline">
              Go to dashboard
            </Link>
          </p>
        )}
      </AuthCard>
    );
  }

  if (status === 'email-mismatch') {
    return (
      <AuthCard
        title="Wrong account"
        subtitle={`This invitation was sent to ${preview?.email}. Sign out and use that email.`}
      >
        <Button variant="primary" onClick={() => void handleSignOut()}>
          Sign out
        </Button>
      </AuthCard>
    );
  }

  if (status === 'confirm-email') {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We sent a confirmation link to finish creating your account."
      >
        <Alert variant="success">
          Open the link in <strong>{preview?.email}</strong>, then you will join{' '}
          <strong>{preview?.accountName}</strong>.
        </Alert>
        <p className="mt-4 text-sm text-text-2">
          Already confirmed?{' '}
          <Link
            href={`/auth/login?return=${encodeURIComponent(returnUrl)}`}
            className="text-stripe font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  if (status === 'done') {
    return (
      <AuthCard title="Welcome" subtitle="You have joined the team. Redirecting…">
        <p className="text-sm text-text-2">Taking you to the dashboard…</p>
      </AuthCard>
    );
  }

  const workspaces =
    preview?.workspaceNames?.length
      ? preview.workspaceNames.join(', ')
      : 'assigned workspaces';

  return (
    <AuthCard
      title={`Join ${preview?.accountName ?? 'your team'}`}
      subtitle={`${preview?.inviterName} invited you as ${preview?.role === 'admin' ? 'an admin' : 'a member'}.`}
      footer={
        <p className="text-sm text-text-2">
          Already have an account?{' '}
          <Link
            href={`/auth/login?return=${encodeURIComponent(returnUrl)}`}
            className="text-stripe font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <p className="text-sm text-text-2 mb-4">
        Access: <span className="text-ink font-medium">{workspaces}</span>
      </p>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={preview?.email ?? ''}
          readOnly
          disabled
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {message && <Alert variant="error">{message}</Alert>}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? 'Creating account…' : 'Create account & join'}
        </Button>
      </form>
      <p className="mt-3 text-xs text-text-3">
        After joining, you can optionally set up two-factor authentication.
      </p>
    </AuthCard>
  );
}

export default function InvitePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Suspense
        fallback={
          <AuthCard title="Team invitation" subtitle="Loading…">
            <p className="text-sm text-text-2">Loading…</p>
          </AuthCard>
        }
      >
        <InviteAcceptContent />
      </Suspense>
    </main>
  );
}
