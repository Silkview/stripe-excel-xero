'use client';

import { useState } from 'react';

export type ConnRowMenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
};

export default function ConnRow({
  provider,
  name,
  status,
  hint,
  action,
  menuItems,
}: {
  provider: 'xero' | 'stripe';
  name: string;
  status: 'connected' | 'disconnected' | 'warning';
  hint?: string;
  action?: React.ReactNode;
  menuItems?: ConnRowMenuItem[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const icon =
    provider === 'xero' ? (
      <span className="flex h-6 w-6 items-center justify-center rounded bg-xero-light text-[10px] font-bold text-xero">
        X
      </span>
    ) : (
      <span className="flex h-6 w-6 items-center justify-center rounded bg-stripe/10 text-[10px] font-bold text-stripe">
        S
      </span>
    );

  const statusDot =
    status === 'connected'
      ? 'bg-green'
      : status === 'warning'
        ? 'bg-amber'
        : 'bg-border';

  return (
    <div className="relative flex items-center gap-2.5 rounded-lg border border-border bg-bg px-3 py-2">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium text-ink">{name}</div>
        {hint && (
          <div className="truncate text-[11px] text-text-3">{hint}</div>
        )}
      </div>
      {action}
      {menuItems && menuItems.length > 0 && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-6 w-6 items-center justify-center rounded text-text-3 hover:bg-surface hover:text-ink"
            aria-label="Connection actions"
          >
            ⋯
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-7 z-20 min-w-[120px] rounded-lg border border-border bg-surface py-1 shadow-lg">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      item.onClick();
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-xs ${
                      item.danger
                        ? 'text-red hover:bg-red-light'
                        : 'text-ink hover:bg-bg'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
    </div>
  );
}
