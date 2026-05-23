import WorkspaceSelect, { type WorkspaceOption } from './WorkspaceSelect';

interface HeaderProps {
  onOpenSetup: () => void;
  workspaces?: WorkspaceOption[];
  workspaceId?: string | null;
  onWorkspaceChange?: (id: string) => void;
  workspaceLoading?: boolean;
}

export default function Header({
  onOpenSetup,
  workspaces = [],
  workspaceId = null,
  onWorkspaceChange,
  workspaceLoading,
}: HeaderProps) {
  const showWorkspace =
    workspaces.length > 0 && typeof onWorkspaceChange === 'function';

  return (
    <header className="bg-surface px-4 py-3.5 pb-3 border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 shrink-0 bg-stripe rounded-[7px] flex items-center justify-center text-[11px] font-bold text-white tracking-tight font-mono">
            Sv
          </div>
          <span className="text-[15px] font-semibold tracking-tight truncate">
            Silkview Sync
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenSetup}
          className="w-[30px] h-[30px] shrink-0 border border-border bg-bg rounded-sm flex items-center justify-center cursor-pointer text-text-2 text-sm hover:bg-border hover:text-text transition-colors"
          title="Setup"
          aria-label="Setup"
        >
          ⚙
        </button>
      </div>
      {showWorkspace && (
        <WorkspaceSelect
          workspaces={workspaces}
          workspaceId={workspaceId}
          onChange={onWorkspaceChange}
          loading={workspaceLoading}
        />
      )}
    </header>
  );
}
