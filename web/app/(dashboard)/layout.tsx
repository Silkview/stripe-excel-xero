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
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?return=/dashboard');
  }

  try {
    const onboarding = await getOnboardingStatusForUser(
      user.id,
      user.user_metadata as Record<string, unknown>
    );
    if (onboarding.needsAccountSetup) {
      redirect('/onboarding');
    }

    const context = await loadDashboardContext(user.id, user.email ?? '');
    if (!context) {
      redirect('/onboarding');
    }

    return <DashboardShell context={context}>{children}</DashboardShell>;
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }
    console.error('[dashboard-layout]', error);
    redirect('/auth/login?return=/dashboard');
  }
}
