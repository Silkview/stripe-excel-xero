'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { prepareTotpEnrollment, getMfaStatus, verifyTotpEnrollment } from '@/lib/auth/mfa';
import { markMfaEnrollmentSkipped } from '@/lib/auth/mfa-enrollment';
import { syncBrowserSessionToServer } from '@/lib/auth/credentials';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

type Props = {
  onComplete: () => void;
  onSkip: () => void;
  verifyReturnPath?: string;
};

export default function MfaEnrollStep({
  onComplete,
  onSkip,
  verifyReturnPath = '/auth/mfa/verify',
}: Props) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser();
      const status = await getMfaStatus(supabase);

      if (status.hasVerifiedTotp) {
        onComplete();
        return;
      }

      if (status.needsVerification) {
        window.location.href = verifyReturnPath;
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
  }, [onComplete, verifyReturnPath]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowser();
      await verifyTotpEnrollment(supabase, factorId, code.trim());

      const { data: refreshData, error: refreshErr } =
        await supabase.auth.refreshSession();
      if (refreshErr) throw refreshErr;

      if (refreshData.session) {
        await syncBrowserSessionToServer(refreshData.session);
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-text-2">Preparing your QR code…</p>;
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      {qr && (
        <div className="flex justify-center rounded border border-border bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Authenticator QR code" width={180} height={180} />
        </div>
      )}
      <p className="text-sm text-text-2">
        Scan the QR code with an authenticator app (Google Authenticator, 1Password,
        etc.), then enter the 6-digit code. You can skip and set this up later.
      </p>
      <Input
        label="Verification code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
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
        onClick={() => {
          void (async () => {
            try {
              const supabase = createSupabaseBrowser();
              await markMfaEnrollmentSkipped(supabase);
              onSkip();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : 'Could not continue. Try again.'
              );
            }
          })();
        }}
      >
        Skip for now
      </Button>
    </form>
  );
}
