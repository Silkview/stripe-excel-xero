export type WorkspaceOption = {
  id: string;
  name: string;
};

interface WorkspaceSelectProps {
  workspaces: WorkspaceOption[];
  workspaceId: string | null;
  onChange: (id: string) => void;
  loading?: boolean;
  inline?: boolean;
}

export default function WorkspaceSelect({
  workspaces,
  workspaceId,
  onChange,
  loading,
  inline = false,
}: WorkspaceSelectProps) {
  if (!workspaces.length) return null;

  if (inline) {
    return (
      <select
        value={workspaceId ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || workspaces.length === 0}
        className="flex-1 min-w-0 font-sans text-[13px] font-medium text-ink border border-border rounded-[7px] py-1.5 px-2.5 bg-bg outline-none cursor-pointer appearance-none disabled:opacity-60 focus:border-accent"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238F96AD' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
          paddingRight: '26px',
        }}
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    );
  }

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
