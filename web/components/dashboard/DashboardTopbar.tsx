'use client';

import { useState } from 'react';
import { PRODUCT_NAME } from '@stripesync/shared/brand';
import {
  getAddinManifestUrl,
  getExcelSignInUrl,
  tryOpenExcel,
} from '@/lib/excel-launch';
import Button from '@/components/ui/Button';

const titles: Record<string, string> = {
  '/dashboard': 'Workspaces',
  '/dashboard/team': 'Team',
  '/dashboard/security': 'Security & MFA',
  '/dashboard/settings': 'Account settings',
};

export default function DashboardTopbar({ pathname }: { pathname: string }) {
  const [showExcelHelp, setShowExcelHelp] = useState(false);
  const title = titles[pathname] ?? 'Dashboard';
  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? '';

  const openExcel = () => {
    tryOpenExcel();
    setShowExcelHelp(true);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-7">
      <h1 className="text-[15px] font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-2">
        {showExcelHelp && (
          <div className="mr-2 max-w-xs rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text-2">
            <p className="font-medium text-ink">Open {PRODUCT_NAME} in Excel</p>
            <p className="mt-1">
              Insert → My Add-ins → {PRODUCT_NAME}.{' '}
              <a
                href={getAddinManifestUrl()}
                className="text-accent underline"
                target="_blank"
                rel="noreferrer"
              >
                Manifest
              </a>
            </p>
            <button
              type="button"
              className="mt-1 text-text-3 hover:text-ink"
              onClick={() => setShowExcelHelp(false)}
            >
              Dismiss
            </button>
          </div>
        )}
        <Button
          variant="secondary"
          className="!py-1.5 !px-3 !text-xs"
          href={getExcelSignInUrl(appUrl)}
        >
          Sign in for Excel
        </Button>
        <Button
          variant="primary"
          className="!py-1.5 !px-3 !text-xs !bg-accent hover:!bg-accent-hover"
          onClick={openExcel}
        >
          Open in Excel
        </Button>
      </div>
    </header>
  );
}
