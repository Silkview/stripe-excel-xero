import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getOnboardingStatusForUser } from '@/lib/auth/onboarding-status';
import { loadDashboardContext } from '@/lib/dashboard/load-context';
import { dashboardDebugLog } from '@/lib/dashboard-debug-log';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  dashboardDebugLog(
    'layout.tsx:entry',
    'dashboard layout render start',
    {},
    'D'
  );

  let supabase;
  try {
    supabase = await createSupabaseServer();
    dashboardDebugLog(
      'layout.tsx:supabase',
      'createSupabaseServer ok',
      {},
      'D'
    );
  } catch (err) {
    dashboardDebugLog(
      'layout.tsx:supabase-error',
      'createSupabaseServer failed',
      { error: err instanceof Error ? err.message : String(err) },
      'D'
    );
    throw err;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  dashboardDebugLog(
    'layout.tsx:user',
    'getUser result',
    {
      hasUser: !!user,
      userError: userError?.message ?? null,
      userIdPrefix: user?.id?.slice(0, 8) ?? null,
    },
    'D'
  );

  if (!user) {
    redirect('/auth/login');
  }

  let onboarding;
  try {
    onboarding = await getOnboardingStatusForUser(
      user.id,
      user.user_metadata as Record<string, unknown>
    );
    dashboardDebugLog(
      'layout.tsx:onboarding',
      'onboarding status loaded',
      {
        needsAccountSetup: onboarding.needsAccountSetup,
        needsOnboarding: onboarding.needsOnboarding,
      },
      'A'
    );
  } catch (err) {
    dashboardDebugLog(
      'layout.tsx:onboarding-error',
      'getOnboardingStatusForUser failed',
      { error: err instanceof Error ? err.message : String(err) },
      'A'
    );
    throw err;
  }

  if (onboarding.needsAccountSetup) {
    redirect('/onboarding');
  }

  let context;
  try {
    context = await loadDashboardContext(user.id, user.email ?? '');
    dashboardDebugLog(
      'layout.tsx:context',
      'dashboard context loaded',
      { hasContext: !!context, planCode: context?.planCode ?? null },
      'B'
    );
  } catch (err) {
    dashboardDebugLog(
      'layout.tsx:context-error',
      'loadDashboardContext failed',
      { error: err instanceof Error ? err.message : String(err) },
      'B'
    );
    throw err;
  }

  if (!context) {
    redirect('/onboarding');
  }

  dashboardDebugLog(
    'layout.tsx:success',
    'dashboard layout render success',
    { planCode: context.planCode },
    'C'
  );

  return <DashboardShell context={context}>{children}</DashboardShell>;
}
