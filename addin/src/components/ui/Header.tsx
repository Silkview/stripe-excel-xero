interface HeaderProps {
  onOpenSetup: () => void;
}

export default function Header({ onOpenSetup }: HeaderProps) {
  return (
    <header className="bg-surface px-4 py-3.5 pb-3 border-b border-border flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-stripe rounded-[7px] flex items-center justify-center text-[11px] font-bold text-white tracking-tight font-mono">
          Sv
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Silkview Sync</span>
      </div>
      <button
        type="button"
        onClick={onOpenSetup}
        className="w-[30px] h-[30px] border border-border bg-bg rounded-sm flex items-center justify-center cursor-pointer text-text-2 text-sm hover:bg-border hover:text-text transition-colors"
        title="Setup"
        aria-label="Setup"
      >
        ⚙
      </button>
    </header>
  );
}
