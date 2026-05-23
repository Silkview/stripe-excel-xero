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
        router.replace('/onboarding');
        return;
      }

      const supabase = createSupabaseBrowser();
      const status = await getMfaStatus(supabase);

      if (!(await needsMfaEnrollmentSetup(supabase))) {
        router.replace(
          await resolvePostAuthRedirect(supabase, { returnPath })
        );
        return;
      }

      if (status.needsVerification) {
        router.replace('/auth/mfa/verify');
        return;
      }

      try {
        const enrolled = await prepareTotpEnrollment(supabase);
        setFactorId(enrolled.id);
        setQr(enrolled.totp?.qr_code ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not start MFA setup.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, returnPath]);

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
