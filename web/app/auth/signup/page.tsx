'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { normalizeAuthEmail, syncBrowserSessionToServer } from '@/lib/auth/credentials';
import AuthCard from '@/components/ui/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountName, setAccountName] = useState('');
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

    setLoading(true);
    const supabase = createSupabaseBrowser();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const normalizedEmail = normalizeAuthEmail(email);

    const { data, error: err } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: accountName.trim()
          ? { account_name: accountName.trim() }
          : undefined,
      },
    });

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      setError(
        'An account with this email already exists. Sign in or use “Forgot password” in Supabase if needed.'
      );
      return;
    }

    if (data.session) {
      await syncBrowserSessionToServer(data.session);
      router.push('/auth/mfa/enroll');
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We sent a confirmation link to complete your signup."
      >
        <Alert variant="success">
          Open the link in <strong>{email}</strong> to activate your account, then
          you&apos;ll be guided to set up optional two-factor authentication.
        </Alert>
        <p className="mt-4 text-sm text-text-2">
          <Link href="/auth/login" className="text-stripe font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start your 14-day trial. Connect Stripe and Xero from Excel."
      footer={
        <>
          Already have an account?{' '}
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
          label="Company or account name (optional)"
          type="text"
          autoComplete="organization"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
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
