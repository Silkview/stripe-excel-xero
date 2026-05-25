import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getOnboardingStatusForUser } from '@/lib/auth/onboarding-status';
import { loadDashboardContext } from '@/lib/dashboard/load-context';
import DashboardShell from '@/components/dashboard/DashboardShell';

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // #region agent log
  const dbg = (message: string, data: Record<string, unknown> = {}) => {
    fetch('http://127.0.0.1:7788/ingest/a7ed8476-0cc9-4434-ad8f-95a74c199452', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'aa61bb',
      },
      body: JSON.stringify({
        sessionId: 'aa61bb',
        location: 'web/app/(dashboard)/layout.tsx',
        hypothesisId: 'H_DASH',
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  };
  dbg('layout:enter');
  // #endregion

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // #region agent log
  dbg('layout:after-getUser', { hasUser: !!user, userId: user?.id ?? null });
  // #endregion

  if (!user) {
    // #region agent log
    dbg('layout:redirect-no-user');
    // #endregion
    redirect('/auth/login?return=/dashboard');
  }

  try {
    const onboarding = await getOnboardingStatusForUser(
      user.id,
      user.user_metadata as Record<string, unknown>
    );
    // #region agent log
    dbg('layout:after-onboarding', {
      needsAccountSetup: onboarding.needsAccountSetup,
    });
    // #endregion
    if (onboarding.needsAccountSetup) {
      redirect('/onboarding');
    }

    const context = await loadDashboardContext(user.id, user.email ?? '');
    // #region agent log
    dbg('layout:after-loadContext', {
      hasContext: !!context,
      planCode: context?.planCode ?? null,
      billingBlocked: context?.billingBlocked ?? null,
      needsDowngradeSelection: context?.needsDowngradeSelection ?? null,
      productBlocked: context?.productBlocked ?? null,
    });
    // #endregion
    if (!context) {
      redirect('/onboarding');
    }

    // #region agent log
    dbg('layout:render-shell');
    // #endregion
    return <DashboardShell context={context}>{children}</DashboardShell>;
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    // #region agent log
    dbg('layout:catch-error', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : null,
    });
    // #endregion
    console.error('[dashboard-layout]', error);
    redirect('/auth/login?return=/dashboard');
  }
}
