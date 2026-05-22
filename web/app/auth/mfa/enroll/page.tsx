'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { enrollTotp, getMfaStatus, verifyTotpEnrollment } from '@/lib/auth/mfa';
import AuthCard from '@/components/ui/AuthCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function MfaEnrollPage() {
  const router = useRouter();
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
        router.replace('/dashboard');
        return;
      }

      if (status.needsVerification) {
        router.replace('/auth/mfa/verify');
        return;
      }

      try {
        const enrolled = await enrollTotp(supabase);
        setFactorId(enrolled.id);
        setQr(enrolled.totp?.qr_code ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not start MFA setup.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowser();
      await verifyTotpEnrollment(supabase, factorId, code.trim());
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <AuthCard
      title="Secure your account"
      subtitle="Optional: add an authenticator app for two-factor sign-in."
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
