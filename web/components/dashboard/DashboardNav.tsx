'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/browser';
import Button from '@/components/ui/Button';

interface DashboardNavProps {
  email: string;
}

export default function DashboardNav({ email }: DashboardNavProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="/dashboard" className="text-lg font-bold text-text">
          Silkview <span className="text-stripe">Sync</span>
        </a>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-text-2 sm:inline">{email}</span>
          <Button variant="ghost" onClick={handleSignOut} className="!py-2 !px-3">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
