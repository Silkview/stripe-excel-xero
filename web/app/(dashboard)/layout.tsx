import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getOnboardingStatusForUser } from '@/lib/auth/onboarding-status';
import { loadDashboardContext } from '@/lib/dashboard/load-context';
import DashboardShell from '@/components/dashboard/DashboardShell';

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
    redirect('/auth/login');
  }

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
}
