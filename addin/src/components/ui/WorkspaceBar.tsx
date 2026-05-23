import WorkspaceSelect, { type WorkspaceOption } from './WorkspaceSelect';

interface WorkspaceBarProps {
  workspaces: WorkspaceOption[];
  workspaceId: string | null;
  onWorkspaceChange: (id: string) => void;
  loading?: boolean;
}

export default function WorkspaceBar({
  workspaces,
  workspaceId,
  onWorkspaceChange,
  loading,
}: WorkspaceBarProps) {
  if (!workspaces.length) return null;

  return (
    <div className="bg-surface border-b border-border px-3.5 py-2 flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3 shrink-0">
        Workspace
      </span>
      <WorkspaceSelect
        workspaces={workspaces}
        workspaceId={workspaceId}
        onChange={onWorkspaceChange}
        loading={loading}
        inline
      />
    </div>
  );
}
