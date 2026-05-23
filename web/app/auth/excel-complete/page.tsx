'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import { getMfaStatus } from '@/lib/auth/mfa';
import { needsMfaEnrollmentSetup } from '@/lib/auth/mfa-enrollment';
import { syncBrowserSessionToServer } from '@/lib/auth/credentials';
import { navigateExcelAuth } from '@/lib/auth/excel-navigation';
import AuthShell from '@/components/auth/AuthShell';
import Alert from '@/components/ui/Alert';

async function auditExcelComplete(data: Record<string, unknown>) {
  try {
    await fetch('/api/auth/login-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    // Non-fatal
  }
}

function sendTokenToExcel(accessToken: string): boolean {
  const payload = JSON.stringify({
    status: 'signed_in',
    accessToken,
  });
  const addinOrigin = process.env.NEXT_PUBLIC_ADDIN_URL?.replace(/\/$/, '');
  try {
    if (addinOrigin) {
      Office.context.ui.messageParent(payload, addinOrigin);
    } else {
      Office.context.ui.messageParent(payload);
    }
    return true;
  } catch {
    return false;
  }
}

export default function ExcelCompletePage() {
  const startedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState('Completing sign-in…');

  const completeSignIn = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const supabase = createSupabaseBrowser();
      const path = typeof window !== 'undefined' ? window.location.pathname : '';

      const redirectCount = Number(
        sessionStorage.getItem('excel_auth_redirects') ?? '0'
      );
      if (redirectCount > 8) {
        setStatus('error');
        setMessage(
          'Sign-in is stuck in a redirect loop. Close this window, sign in again from Excel, or finish setup at the web dashboard.'
        );
        sessionStorage.removeItem('excel_auth_redirects');
        return;
      }

      const { data: refreshFirst, error: refreshFirstErr } =
        await supabase.auth.refreshSession();
      if (refreshFirstErr) {
        setStatus('error');
        setMessage(refreshFirstErr.message);
        return;
      }

      if (refreshFirst.session) {
        await syncBrowserSessionToServer(refreshFirst.session);
      }

      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'excel-complete:entry',message:'completeSignIn start',data:{path,hasSession:!!refreshFirst.session,redirectCount},timestamp:Date.now(),hypothesisId:'H2-H3',runId:'post-fix'})}).catch(()=>{});
      // #endregion

      const mfa = await getMfaStatus(supabase);
      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'excel-complete:mfa',message:'MFA status',data:{needsVerification:mfa.needsVerification,hasVerifiedTotp:mfa.hasVerifiedTotp,currentLevel:mfa.currentLevel,nextLevel:mfa.nextLevel},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
      // #endregion
      if (await needsMfaEnrollmentSetup(supabase)) {
        sessionStorage.setItem(
          'excel_auth_redirects',
          String(redirectCount + 1)
        );
        navigateExcelAuth('/auth/excel?step=mfa');
        return;
      }

      if (mfa.needsVerification) {
        sessionStorage.setItem(
          'excel_auth_redirects',
          String(redirectCount + 1)
        );
        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'excel-complete:redirect',message:'redirect to mfa verify',data:{target:'/auth/mfa/verify?return=excel'},timestamp:Date.now(),hypothesisId:'H1',runId:'post-fix'})}).catch(()=>{});
        // #endregion
        navigateExcelAuth('/auth/mfa/verify?return=excel');
        return;
      }

      const statusRes = await fetch('/api/onboarding/status', {
        credentials: 'include',
      });
      const statusJson = await statusRes.json().catch(() => null);
      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'excel-complete:onboarding',message:'onboarding status',data:{ok:statusRes.ok,status:statusRes.status,needsOnboarding:!!statusJson?.data?.needsOnboarding,needsAccountSetup:!!statusJson?.data?.needsAccountSetup,success:!!statusJson?.success},timestamp:Date.now(),hypothesisId:'H1-H2'})}).catch(()=>{});
      // #endregion
      if (statusJson?.success && statusJson.data?.needsOnboarding) {
        sessionStorage.setItem(
          'excel_auth_redirects',
          String(redirectCount + 1)
        );
        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'excel-complete:redirect',message:'redirect to onboarding',data:{target:'/onboarding?return=excel'},timestamp:Date.now(),hypothesisId:'H1',runId:'post-fix'})}).catch(()=>{});
        // #endregion
        navigateExcelAuth('/onboarding?return=excel');
        return;
      }

      sessionStorage.removeItem('excel_auth_redirects');

      const session = refreshFirst.session;
      if (!session?.access_token) {
        const {
          data: { session: fallbackSession },
          error,
        } = await supabase.auth.getSession();

        if (error || !fallbackSession?.access_token) {
          setStatus('error');
          setMessage(
            'No active session. Confirm your email if you just signed up, then sign in again from Excel.'
          );
          return;
        }

        await syncBrowserSessionToServer(fallbackSession);

        // #region agent log
        fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'excel-complete:messageParent',message:'sending token to Excel (fallback)',data:{hasOffice:typeof Office!=='undefined'},timestamp:Date.now(),hypothesisId:'H6',runId:'post-fix-v2'})}).catch(()=>{});
        // #endregion
        await auditExcelComplete({
          location: 'excel-complete:messageParent',
          message: 'sending token (fallback session)',
          hypothesisId: 'H6',
          runId: 'post-fix-v2',
        });

        if (sendTokenToExcel(fallbackSession.access_token)) {
          setStatus('done');
          setMessage('Signed in. You can close this window and return to Excel.');
        } else {
          setStatus('error');
          setMessage(
            'Could not send the token to Excel. Close this window and try Sign in again.'
          );
        }
        return;
      }

      if (session) {
        await syncBrowserSessionToServer(session);
      }

      // #region agent log
      fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'49b4e5'},body:JSON.stringify({sessionId:'49b4e5',location:'excel-complete:messageParent',message:'sending token to Excel',data:{hasOffice:typeof Office!=='undefined'},timestamp:Date.now(),hypothesisId:'H6',runId:'post-fix-v2'})}).catch(()=>{});
      // #endregion
      await auditExcelComplete({
        location: 'excel-complete:messageParent',
        message: 'sending token',
        hypothesisId: 'H6',
        runId: 'post-fix-v2',
      });

      if (sendTokenToExcel(session.access_token)) {
        setStatus('done');
        setMessage('Signed in. You can close this window and return to Excel.');
      } else {
        setStatus('error');
        setMessage(
          'Could not send the token to Excel. Close this window and try Sign in again.'
        );
      }
    } catch (err) {
      startedRef.current = false;
      setStatus('error');
      setMessage(
        err instanceof Error
          ? err.message
          : 'Account setup failed. Close this window and try Sign in again from Excel.'
      );
    }
  }, []);

  const onOfficeReady = useCallback(() => {
    void completeSignIn();
  }, [completeSignIn]);

  useEffect(() => {
    if (typeof Office !== 'undefined') {
      Office.onReady(onOfficeReady);
    }
  }, [onOfficeReady]);

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
