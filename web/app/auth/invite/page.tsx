'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import Button from '@/components/ui/Button';

function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();
  const [status, setStatus] = useState<
    'loading' | 'needs-auth' | 'accepting' | 'done' | 'error'
  >('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing invitation token.');
      return;
    }

    const run = async () => {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus('needs-auth');
        return;
      }

      setStatus('accepting');
      try {
        const res = await fetch('/api/account/invite/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!data.success) {
          setStatus('error');
          setMessage(data.error?.message ?? 'Could not accept invitation.');
          return;
        }
        setStatus('done');
        setTimeout(() => router.replace('/dashboard'), 1200);
      } catch {
        setStatus('error');
        setMessage('Could not accept invitation.');
      }
    };

    run();
  }, [token, router]);

  if (status === 'loading' || status === 'accepting') {
    return (
      <p className="text-sm text-text-2">
        {status === 'accepting' ? 'Joining account…' : 'Checking invitation…'}
      </p>
    );
  }

  if (status === 'needs-auth') {
    const returnUrl = `/auth/invite?token=${encodeURIComponent(token)}`;
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-2">
          Sign in or create an account with the email address this invitation was
          sent to, then return here to join the team.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            href={`/auth/login?return=${encodeURIComponent(returnUrl)}`}
            variant="primary"
          >
            Sign in
          </Button>
          <Button
            href={`/auth/signup?return=${encodeURIComponent(returnUrl)}`}
            variant="secondary"
          >
            Create account
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <p className="text-sm text-text-2">
        You have joined the account. Redirecting to dashboard…
      </p>
    );
  }

  return <p className="text-sm text-warn">{message}</p>;
}

export default function InvitePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold text-ink">Team invitation</h1>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-text-2">Loading…</p>}>
          <InviteAcceptContent />
        </Suspense>
      </div>
    </main>
  );
}
