interface SetupStripProps {
  onSetupSheets: () => void;
  onRefreshXero: () => void;
  loadingSheets: boolean;
  loadingRefresh: boolean;
  xeroConnected: boolean;
  dimmed?: boolean;
}

export default function SetupStrip({
  onSetupSheets,
  onRefreshXero,
  loadingSheets,
  loadingRefresh,
  xeroConnected,
  dimmed,
}: SetupStripProps) {
  return (
    <div
      className={`bg-surface border-b border-border px-3.5 py-2.5 transition-opacity ${dimmed ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-3 mb-1.5">
        Quick setup
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onSetupSheets}
          disabled={loadingSheets || loadingRefresh}
          className="flex items-center gap-1.5 p-2 rounded-lg border border-border bg-bg cursor-pointer transition-colors hover:border-[#c5cbda] hover:bg-rule-2 disabled:opacity-60 disabled:cursor-not-allowed text-left"
        >
          <span className="w-7 h-7 rounded-[7px] bg-accent-light flex items-center justify-center text-[13px] shrink-0">
            📋
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-ink leading-tight">
              {loadingSheets ? 'Setting up…' : 'Setup sheets'}
            </span>
            <span className="text-[10.5px] text-ink-3 leading-tight">
              Create workbook tabs
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onRefreshXero}
          disabled={loadingSheets || loadingRefresh || !xeroConnected}
          className="flex items-center gap-1.5 p-2 rounded-lg border border-border bg-bg cursor-pointer transition-colors hover:border-[#c5cbda] hover:bg-rule-2 disabled:opacity-60 disabled:cursor-not-allowed text-left"
        >
          <span className="w-7 h-7 rounded-[7px] bg-xero-light flex items-center justify-center text-[13px] shrink-0">
            ↻
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-ink leading-tight">
              {loadingRefresh ? 'Refreshing…' : 'Refresh Xero'}
            </span>
            <span className="text-[10.5px] text-ink-3 leading-tight">
              Mapping dropdowns
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
