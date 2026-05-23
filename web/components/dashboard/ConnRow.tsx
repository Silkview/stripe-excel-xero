'use client';

export default function ConnRow({
  provider,
  name,
  status,
  hint,
  action,
}: {
  provider: 'xero' | 'stripe';
  name: string;
  status: 'connected' | 'disconnected' | 'warning';
  hint?: string;
  action?: React.ReactNode;
}) {
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
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-bg px-3 py-2">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium text-ink">{name}</div>
        {hint && (
          <div className="truncate text-[11px] text-text-3">{hint}</div>
        )}
      </div>
      {action}
      <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot}`} />
    </div>
  );
}
