import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getPrimaryAccountMembership } from '@/lib/auth/account-membership';
import AccountSettingsPanel from '@/components/dashboard/AccountSettingsPanel';

export default async function DashboardSettingsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const membership = await getPrimaryAccountMembership(user.id);
  if (!membership || membership.role === 'member') {
    redirect('/dashboard');
  }

  return <AccountSettingsPanel />;
}
