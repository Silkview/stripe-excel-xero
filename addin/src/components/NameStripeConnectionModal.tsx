import { useState } from 'react';
import Button from './ui/Button';

export default function NameStripeConnectionModal({
  suggestedName,
  onSave,
  onSkip,
  saving,
}: {
  suggestedName: string;
  onSave: (name: string) => void;
  onSkip: () => void;
  saving?: boolean;
}) {
  const [name, setName] = useState(suggestedName);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setError(null);
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-[320px] rounded-lg border border-border bg-surface shadow-xl">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Name Stripe connection</h2>
        </div>
        <div className="flex flex-col gap-2 px-4 py-3">
          <p className="text-xs text-ink-2">
            Give this Stripe account a friendly name for your team.
          </p>
          <label className="text-[11px] font-medium text-ink-2">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-border bg-bg px-2.5 py-2 text-sm text-ink outline-none focus:border-accent"
            placeholder="e.g. Acme Corp — Live"
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          {error && <p className="text-xs text-warn-text">{error}</p>}
        </div>
        <div className="flex gap-2 border-t border-border px-4 py-3">
          <Button variant="ghost" className="!py-2 !text-xs" onClick={onSkip} disabled={saving}>
            Skip
          </Button>
          <Button variant="build" className="!py-2 !text-xs" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save name'}
          </Button>
        </div>
      </div>
    </div>
  );
}

