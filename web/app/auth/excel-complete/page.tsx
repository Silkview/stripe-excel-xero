'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { navigateExcelAuth } from '@/lib/auth/excel-navigation';
import AuthShell from '@/components/auth/AuthShell';

function ExcelCompleteRedirect() {
  const searchParams = useSearchParams();
  const handoff = searchParams.get('handoff');

  useEffect(() => {
    const path = handoff
      ? `/api/auth/excel-finish?handoff=${encodeURIComponent(handoff)}`
      : '/api/auth/excel-finish';
    navigateExcelAuth(path);
  }, [handoff]);

  return (
    <AuthShell title="Excel sign-in" subtitle="Returning your session to the add-in.">
      <p className="text-sm text-text-2">Completing sign-in…</p>
    </AuthShell>
  );
}

/** Legacy route — forwards to server-rendered Office finish page. */
export default function ExcelCompletePage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Excel sign-in" subtitle="Returning your session to the add-in.">
          <p className="text-sm text-text-2">Completing sign-in…</p>
        </AuthShell>
      }
    >
      <ExcelCompleteRedirect />
    </Suspense>
  );
}
