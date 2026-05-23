import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getPrimaryAccountMembership } from '@/lib/auth/account-membership';
import TeamPanel from '@/components/dashboard/TeamPanel';

export default async function DashboardTeamPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const membership = await getPrimaryAccountMembership(user.id);
  if (!membership || membership.role === 'member') {
    redirect('/dashboard');
  }

  return <TeamPanel />;
}
