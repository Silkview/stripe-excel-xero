import { getAppUrl, getDashboardUrl } from '../../utils/api';

/** Connect logo mark: white lines + grey dot on navy (matches add-in icon). */
function ConnectMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 13 13"
      fill="none"
      className={`w-[13px] h-[13px] ${className}`}
      aria-hidden
    >
      <path
        d="M2 4h9M2 6.5h9M2 9h5.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10.5" cy="9" r="2.5" fill="#8F96AD" />
    </svg>
  );
}

type HeaderProps = {
  signedIn?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onSignOut?: () => void;
};

export default function Header({
  signedIn = false,
  refreshing = false,
  onRefresh,
  onSignOut,
}: HeaderProps) {
  const dashboardUrl = getDashboardUrl();
  const guideUrl = `${getAppUrl()}/support`;

  const actionClass =
    'px-2 py-1 rounded-sm bg-white/10 border border-white/15 text-[11px] font-medium text-white/75 hover:bg-white/[0.18] hover:text-white transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <header className="bg-navy px-3.5 py-2.5 flex items-center justify-between shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-[26px] h-[26px] shrink-0 rounded-sm bg-[#243055] flex items-center justify-center">
          <ConnectMark />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight truncate">
          Silkview <span className="font-normal text-white/50">Connect</span>
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {signedIn && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={actionClass}
            aria-label="Refresh"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        )}
        {signedIn && onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            disabled={refreshing}
            className={actionClass}
            aria-label="Sign out"
          >
            Sign out
          </button>
        )}
        <a
          href={guideUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${actionClass} no-underline`}
        >
          Guide ↗
        </a>
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${actionClass} no-underline flex items-center gap-1`}
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M6 2H2v5h4V2zM14 2h-4v3h4V2zM14 9h-4v5h4V9zM6 11H2v3h4v-3z"
              fill="currentColor"
            />
          </svg>
          Dashboard ↗
        </a>
      </div>
    </header>
  );
}
