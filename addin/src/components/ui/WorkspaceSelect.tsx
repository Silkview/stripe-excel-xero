export type WorkspaceOption = {
  id: string;
  name: string;
};

interface WorkspaceSelectProps {
  workspaces: WorkspaceOption[];
  workspaceId: string | null;
  onChange: (id: string) => void;
  loading?: boolean;
}

export default function WorkspaceSelect({
  workspaces,
  workspaceId,
  onChange,
  loading,
}: WorkspaceSelectProps) {
  if (!workspaces.length) return null;

  return (
    <div className="mt-1.5">
      <label className="text-[10px] font-semibold text-text-2 uppercase tracking-wide">
        Workspace
      </label>
      <select
        value={workspaceId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || workspaces.length === 0}
        className="w-full mt-0.5 text-xs border border-border rounded-sm px-2 py-1.5 bg-bg text-text disabled:opacity-60"
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}
