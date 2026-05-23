'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { getMfaStatus, verifyMfaLogin } from '@/lib/auth/mfa';
import { resolvePostAuthRedirect } from '@/lib/auth/client-post-auth-redirect';
import { syncBrowserSessionToServer } from '@/lib/auth/credentials';
import { navigateExcelAuth } from '@/lib/auth/excel-navigation';
import AuthShell from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

function MfaVerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const excelReturn = searchParams.get('return') === 'excel';
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
        });
        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'mfa-verify:auto-redirect',message:'already verified redirect',data:{excelReturn,next,hasVerifiedTotp:status.hasVerifiedTotp,currentLevel:status.currentLevel},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
        // #endregion
        if (excelReturn) navigateExcelAuth(next, handoff);
        else router.replace(next);
        return;
      }

      setFactorId(status.totpFactorId);
      setLoading(false);
    })();
  }, [router, excelReturn, handoff]);

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
      });
      if (excelReturn) navigateExcelAuth(next, handoff);
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
