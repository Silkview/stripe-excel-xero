export type StepTabId = 'pull' | 'build' | 'push';

interface StepTabsProps {
  active: StepTabId;
  onChange: (tab: StepTabId) => void;
  done?: Partial<Record<StepTabId, boolean>>;
  dimmed?: boolean;
}

const TABS: { id: StepTabId; label: string; num: string }[] = [
  { id: 'pull', label: 'Pull', num: '1' },
  { id: 'build', label: 'Build', num: '2' },
  { id: 'push', label: 'Push', num: '3' },
];

export default function StepTabs({
  active,
  onChange,
  done = {},
  dimmed,
}: StepTabsProps) {
  return (
    <div
      className={`flex bg-surface border-b border-border px-3.5 transition-opacity ${dimmed ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const isDone = !isActive && done[tab.id];
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-2.5 px-1 text-center text-[11px] font-medium uppercase tracking-wider border-b-2 transition-colors flex flex-col items-center gap-0.5 ${
              isActive
                ? 'text-accent border-accent'
                : isDone
                  ? 'text-success border-transparent'
                  : 'text-ink-3 border-transparent'
            }`}
          >
            <span
              className={`w-[18px] h-[18px] rounded-full text-[10px] font-mono flex items-center justify-center transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : isDone
                    ? 'bg-success text-white'
                    : 'bg-rule text-ink-3'
              }`}
            >
              {tab.num}
            </span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
