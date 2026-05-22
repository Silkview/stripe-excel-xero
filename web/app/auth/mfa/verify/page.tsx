'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { getMfaStatus, verifyMfaLogin } from '@/lib/auth/mfa';
import { ensureAccountProvisioned } from '@/lib/auth/excel-auth-flow';
import AuthShell from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

function MfaVerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const excelReturn = searchParams.get('return') === 'excel';

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser();
      const status = await getMfaStatus(supabase);

      if (!status.hasVerifiedTotp) {
        router.replace(excelReturn ? '/auth/excel' : '/auth/mfa/enroll');
        return;
      }

      if (!status.needsVerification) {
        router.replace(excelReturn ? '/auth/excel-complete' : '/dashboard');
        return;
      }

      setFactorId(status.totpFactorId);
      setLoading(false);
    })();
  }, [router, excelReturn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowser();
      await verifyMfaLogin(supabase, factorId, code.trim());

      if (excelReturn) {
        try {
          await ensureAccountProvisioned();
        } catch {
          // Non-fatal
        }
        router.push('/auth/excel-complete');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Two-factor authentication"
      subtitle={
        excelReturn
          ? 'Enter your authenticator code to finish signing in to Excel.'
          : 'Enter the code from your authenticator app.'
      }
    >
      {loading ? (
        <p className="text-sm text-text-2">Loading…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Verification code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          {error && <Alert variant="error">{error}</Alert>}
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Continue'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function MfaVerifyPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Two-factor authentication" subtitle="Loading…">
          <p className="text-sm text-text-2">Loading…</p>
        </AuthShell>
      }
    >
      <MfaVerifyInner />
    </Suspense>
  );
}
