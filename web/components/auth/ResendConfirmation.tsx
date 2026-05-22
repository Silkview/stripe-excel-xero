'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { resendSignupConfirmation } from '@/lib/auth/credentials';
import Alert from '@/components/ui/Alert';

type Props = {
  email: string;
};

export default function ResendConfirmation({ email }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleResend = async () => {
    if (!email.trim()) {
      setMessage('Enter your email above first.');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage(null);
    setIsError(false);

    const supabase = createSupabaseBrowser();
    const result = await resendSignupConfirmation(supabase, email);

    setLoading(false);
    setMessage(result.message);
    setIsError(!result.ok);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={loading}
        className="text-sm text-stripe font-medium hover:underline disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Resend confirmation email'}
      </button>
      {message && (
        <Alert variant={isError ? 'error' : 'success'}>{message}</Alert>
      )}
    </div>
  );
}
