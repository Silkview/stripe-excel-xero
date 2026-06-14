import Button from '../ui/Button';

const COMPARISON_ROWS = [
  { other: 'Push to Xero automatically', silkview: 'You review in Excel first' },
  { other: 'Errors found at BAS time', silkview: 'Errors caught in Excel' },
  { other: 'Black-box mapping', silkview: 'Your formulas, your codes' },
] as const;

type ValuePropScreenProps = {
  onStartTrial: () => void;
};

export default function ValuePropScreen({ onStartTrial }: ValuePropScreenProps) {
  return (
    <div className="flex-1">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-[15px] font-medium text-ink mb-1">Why Silkview Connect?</h2>
        <p className="text-[12.5px] text-ink-2 leading-snug">
          Xero&apos;s native Stripe integration handles basic invoice payments. This handles
          everything else — and keeps you in control.
        </p>
      </div>

      <div className="px-5 mb-3.5">
        <div className="border border-rule rounded overflow-hidden">
          <div className="grid grid-cols-2">
            {COMPARISON_ROWS.flatMap((row, index) => [
              <div
                key={`${index}-other`}
                className={`px-[11px] py-2 bg-bg border-r border-rule ${
                  index < COMPARISON_ROWS.length - 1 ? 'border-b' : ''
                }`}
              >
                {index === 0 && (
                  <div className="text-[10px] font-medium text-ink-2 uppercase tracking-wider mb-0.5">
                    Other tools
                  </div>
                )}
                <div className="text-xs text-ink-2">{row.other}</div>
              </div>,
              <div
                key={`${index}-silkview`}
                className={`px-[11px] py-2 bg-accent-light ${
                  index < COMPARISON_ROWS.length - 1 ? 'border-b border-rule' : ''
                }`}
              >
                {index === 0 && (
                  <div className="text-[10px] font-medium text-accent-hover uppercase tracking-wider mb-0.5">
                    Silkview
                  </div>
                )}
                <div className="text-xs text-accent-hover">{row.silkview}</div>
              </div>,
            ])}
          </div>
        </div>
      </div>

      <div className="px-5 mb-3.5 grid grid-cols-2 gap-2">
        <div className="bg-bg rounded p-3 text-center">
          <div className="text-xl font-medium text-ink">2,000</div>
          <div className="text-[11px] text-ink-2">rows per pull (Pro)</div>
        </div>
        <div className="bg-bg rounded p-3 text-center">
          <div className="text-xl font-medium text-ink">AUD</div>
          <div className="text-[11px] text-ink-2">currency matched to Xero</div>
        </div>
      </div>

      <div className="px-5 pb-[18px]">
        <Button variant="build" onClick={onStartTrial}>
          Start free trial →
        </Button>
        <p className="text-center mt-2 text-[11.5px] text-ink-2">
          14-day Pro trial · No card required
        </p>
      </div>
    </div>
  );
}
