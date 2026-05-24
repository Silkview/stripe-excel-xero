'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { requestPasswordReset } from '@/lib/auth/credentials';
import AuthCard from '@/components/ui/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setIsError(false);

    const supabase = createSupabaseBrowser();
    const result = await requestPasswordReset(supabase, email);

    setLoading(false);
    setMessage(result.message);
    setIsError(!result.ok);
  };

  return (
    <AuthCard
      title="Reset password"
      subtitle="Enter your email and we'll send you a link to choose a new password."
      footer={
        <>
          Remember your password?{' '}
          <Link href="/auth/login" className="text-stripe font-medium hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {message && (
          <Alert variant={isError ? 'error' : 'success'}>{message}</Alert>
        )}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthCard>
  );
}
