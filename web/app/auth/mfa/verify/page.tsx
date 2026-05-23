'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { getMfaStatus, verifyMfaLogin } from '@/lib/auth/mfa';
import {
  resolvePostAuthRedirect,
  safeReturnPath,
} from '@/lib/auth/client-post-auth-redirect';
import { syncBrowserSessionToServer } from '@/lib/auth/credentials';
import { navigateExcelAuthWithHandoff } from '@/lib/auth/excel-handoff-client';
import { navigateExcelAuth } from '@/lib/auth/excel-navigation';
import AuthShell from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

function MfaVerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturn = searchParams.get('return');
  const excelReturn = rawReturn === 'excel';
  const returnPath = excelReturn ? null : safeReturnPath(rawReturn);
  const handoff = searchParams.get('handoff');

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser();
      const { data: refreshData, error: refreshErr } =
        await supabase.auth.refreshSession();
      if (!refreshErr && refreshData.session) {
        await syncBrowserSessionToServer(refreshData.session);
      }
      const status = await getMfaStatus(supabase);

      if (!status.hasVerifiedTotp) {
        const enrollPath = excelReturn
          ? '/auth/excel?step=mfa'
          : '/auth/mfa/enroll';
        if (excelReturn) navigateExcelAuth(enrollPath, handoff);
        else router.replace(enrollPath);
        return;
      }

      if (!status.needsVerification) {
        const next = await resolvePostAuthRedirect(supabase, {
          excelMode: excelReturn,
          returnPath,
        });
        if (excelReturn) await navigateExcelAuthWithHandoff(next, handoff);
        else router.replace(next);
        return;
      }

      setFactorId(status.totpFactorId);
      setLoading(false);
    })();
  }, [router, excelReturn, handoff, returnPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowser();
      await verifyMfaLogin(supabase, factorId, code.trim());

      const { data: refreshData, error: refreshErr } =
        await supabase.auth.refreshSession();
      if (refreshErr) throw refreshErr;

      const session = refreshData.session;
      if (session) {
        await syncBrowserSessionToServer(session);
      }

      const next = await resolvePostAuthRedirect(supabase, {
        excelMode: excelReturn,
        returnPath,
      });
      if (excelReturn) await navigateExcelAuthWithHandoff(next, handoff);
      else router.push(next);
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
