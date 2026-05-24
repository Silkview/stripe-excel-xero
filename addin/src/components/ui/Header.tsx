import { getDashboardUrl } from '../../utils/api';

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

export default function Header() {
  const dashboardUrl = getDashboardUrl();

  return (
    <header className="bg-navy px-3.5 py-2.5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-[26px] h-[26px] shrink-0 rounded-sm bg-[#243055] flex items-center justify-center">
          <ConnectMark />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">
          Silkview <span className="font-normal text-white/50">Connect</span>
        </span>
      </div>
      <a
        href={dashboardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-2.5 py-1 rounded-sm bg-white/10 border border-white/15 text-[11.5px] font-medium text-white/75 no-underline hover:bg-white/[0.18] hover:text-white transition-colors shrink-0"
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M6 2H2v5h4V2zM14 2h-4v3h4V2zM14 9h-4v5h4V9zM6 11H2v3h4v-3z"
            fill="currentColor"
          />
        </svg>
        Dashboard ↗
      </a>
    </header>
  );
}
