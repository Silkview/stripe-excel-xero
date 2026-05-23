'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import {
  resolvePostAuthRedirect,
  safeReturnPath,
} from '@/lib/auth/client-post-auth-redirect';
import { syncBrowserSessionToServer } from '@/lib/auth/credentials';
import { navigateExcelAuth } from '@/lib/auth/excel-navigation';
import AuthCard from '@/components/ui/AuthCard';
import Alert from '@/components/ui/Alert';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnParam = searchParams.get('return');
  const excelReturn = returnParam === 'excel';
  const returnPath = excelReturn ? null : safeReturnPath(returnParam);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowser();
      const code = searchParams.get('code');

      if (code) {
        const { error: exchangeErr } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) {
          setError(exchangeErr.message);
          return;
        }
      }

      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();

      if (sessionErr || !session) {
        router.replace('/auth/login');
        return;
      }

      await syncBrowserSessionToServer(session);

      const path = await resolvePostAuthRedirect(supabase, {
        excelMode: excelReturn,
        returnPath,
      });

      await fetch('/api/auth/login-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'auth/callback:page',
          message: 'callback redirect',
          data: { excelReturn, path, hasCode: !!code },
          runId: 'post-fix-inline-mfa',
        }),
      }).catch(() => {});

      if (excelReturn) {
        navigateExcelAuth(path);
      } else {
        router.replace(path);
      }
    })();
  }, [router, searchParams, excelReturn]);

  return (
    <AuthCard title="Confirming your email" subtitle="Finishing sign-in…">
      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : (
        <p className="text-sm text-text-2">Please wait…</p>
      )}
    </AuthCard>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Confirming your email" subtitle="Loading…">
          <p className="text-sm text-text-2">Loading…</p>
        </AuthCard>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
