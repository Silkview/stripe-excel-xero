'use client';

import { useCallback, useState } from 'react';
import Script from 'next/script';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { ensureAccountProvisioned } from '@/lib/auth/excel-auth-flow';
import AuthShell from '@/components/auth/AuthShell';
import Alert from '@/components/ui/Alert';

export default function ExcelCompletePage() {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState('Completing sign-in…');

  const completeSignIn = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowser();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.access_token) {
        setStatus('error');
        setMessage(
          'No active session. Confirm your email if you just signed up, then sign in again from Excel.'
        );
        return;
      }

      try {
        await ensureAccountProvisioned(session.access_token);
      } catch {
        // Non-fatal
      }

      const payload = JSON.stringify({
        status: 'signed_in',
        accessToken: session.access_token,
      });

      try {
        Office.context.ui.messageParent(payload);
        setStatus('done');
        setMessage('Signed in. You can close this window and return to Excel.');
      } catch {
        setStatus('error');
        setMessage(
          'Could not send the token to Excel. Close this window and try Sign in again.'
        );
      }
    } catch {
      setStatus('error');
      setMessage('Sign-in failed. Close this window and try again from Excel.');
    }
  }, []);

  const onOfficeReady = useCallback(() => {
    void completeSignIn();
  }, [completeSignIn]);

  return (
    <>
      <Script
        src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof Office !== 'undefined') {
            Office.onReady(onOfficeReady);
          }
        }}
      />
      <AuthShell title="Excel sign-in" subtitle="Returning your session to the add-in.">
        {status === 'loading' && (
          <p className="text-sm text-text-2">{message}</p>
        )}
        {status === 'done' && <Alert variant="success">{message}</Alert>}
        {status === 'error' && <Alert variant="error">{message}</Alert>}
      </AuthShell>
    </>
  );
}
