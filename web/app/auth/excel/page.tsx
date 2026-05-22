'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { getExcelPostLoginPath } from '@/lib/auth/excel-auth-flow';
import {
  signInWithPassword,
  syncBrowserSessionToServer,
} from '@/lib/auth/credentials';
import ResendConfirmation from '@/components/auth/ResendConfirmation';
import AuthShell from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

type AuthMode = 'password' | 'magic';

export default function ExcelAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const nextPath = await getExcelPostLoginPath(supabase);
    setLoading(false);
    router.push(nextPath);
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
    <AuthShell
      title="Sign in to Excel"
      subtitle="Connect Stripe and Xero from your workbook."
    >
      {magicSent ? (
        <Alert variant="success">
          Check your inbox and open the magic link in this window. You will return
          to Excel automatically when done.
        </Alert>
      ) : mode === 'password' ? (
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
              setMode('magic');
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
            We will email you a one-time link. Open it in this window to finish
            sign-in.
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
              setMode('password');
              setError(null);
            }}
            className="w-full text-sm text-text-2 hover:text-text"
          >
            Sign in with password instead
          </button>
        </form>
      )}
    </AuthShell>
  );
}
