'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { prepareTotpEnrollment, getMfaStatus, verifyTotpEnrollment } from '@/lib/auth/mfa';
import {
  markMfaEnrollmentSkipped,
  needsMfaEnrollmentSetup,
} from '@/lib/auth/mfa-enrollment';
import {
  resolvePostAuthRedirect,
  safeReturnPath,
} from '@/lib/auth/client-post-auth-redirect';
import AuthCard from '@/components/ui/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

function MfaEnrollInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = safeReturnPath(searchParams.get('return'));
  const voluntarySetup = searchParams.get('voluntary') === '1';
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const statusRes = await fetch('/api/onboarding/status', {
        credentials: 'include',
      });
      const statusJson = await statusRes.json();
      if (statusJson.success && statusJson.data?.needsAccountSetup) {
        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'mfa/enroll/page.tsx:redirect',message:'redirect needsAccountSetup',data:{branch:'onboarding'},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        router.replace('/onboarding');
        return;
      }

      const supabase = createSupabaseBrowser();
      const status = await getMfaStatus(supabase);
      const needsSetup = await needsMfaEnrollmentSetup(supabase);
      const { data: { user } } = await supabase.auth.getUser();
      const skipped = user?.user_metadata?.mfa_enroll_skipped === true;
      const allowEnrollment =
        voluntarySetup
          ? !status.hasVerifiedTotp && !status.needsVerification
          : needsSetup;

      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'mfa/enroll/page.tsx:init',message:'enroll page init',data:{needsSetup,skipped,voluntarySetup,allowEnrollment,hasVerifiedTotp:status.hasVerifiedTotp,needsVerification:status.needsVerification,returnPath},timestamp:Date.now(),hypothesisId:'A-B-D'})}).catch(()=>{});
      // #endregion

      if (!allowEnrollment) {
        const dest = await resolvePostAuthRedirect(supabase, { returnPath });
        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'mfa/enroll/page.tsx:redirect',message:'redirect not needsSetup',data:{branch:'postAuth',dest,skipped},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        router.replace(dest);
        return;
      }

      if (status.needsVerification) {
        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'mfa/enroll/page.tsx:redirect',message:'redirect needsVerification',data:{branch:'verify'},timestamp:Date.now(),hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        router.replace('/auth/mfa/verify');
        return;
      }

      try {
        if (voluntarySetup && skipped) {
          await supabase.auth.updateUser({ data: { mfa_enroll_skipped: null } });
        }
        const enrolled = await prepareTotpEnrollment(supabase);
        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'mfa/enroll/page.tsx:enrolled',message:'prepareTotpEnrollment ok',data:{factorId:enrolled.id,hasQr:!!enrolled.totp?.qr_code},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setFactorId(enrolled.id);
        setQr(enrolled.totp?.qr_code ?? null);
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4702f2'},body:JSON.stringify({sessionId:'4702f2',location:'mfa/enroll/page.tsx:enrollError',message:'prepareTotpEnrollment failed',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setError(err instanceof Error ? err.message : 'Could not start MFA setup.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, returnPath, voluntarySetup]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowser();
      await verifyTotpEnrollment(supabase, factorId, code.trim());
      router.push(await resolvePostAuthRedirect(supabase, { returnPath }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    const supabase = createSupabaseBrowser();
    await markMfaEnrollmentSkipped(supabase);
    router.push(await resolvePostAuthRedirect(supabase, { returnPath }));
  };

  return (
    <AuthCard
      title="Secure your account"
      subtitle="Add an authenticator app for two-factor sign-in, or skip to continue."
    >
      {loading ? (
        <p className="text-sm text-text-2">Preparing your QR code…</p>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          {qr && (
            <div className="flex justify-center rounded border border-border bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Authenticator QR code" width={180} height={180} />
            </div>
          )}
          <p className="text-sm text-text-2">
            Scan the QR code with Google Authenticator, 1Password, or another TOTP
            app, then enter the 6-digit code.
          </p>
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
            {submitting ? 'Verifying…' : 'Enable MFA'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleSkip}
          >
            Skip for now
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function MfaEnrollPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Secure your account" subtitle="Loading…">
          <p className="text-sm text-text-2">Loading…</p>
        </AuthCard>
      }
    >
      <MfaEnrollInner />
    </Suspense>
  );
}
