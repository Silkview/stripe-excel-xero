import type { NotificationKind } from '../context/NotificationContext';

const kindStyles: Record<
  NotificationKind,
  { card: string; icon: string }
> = {
  success: {
    card: 'bg-success-bg border-success/30 text-success-text',
    icon: '✓',
  },
  warn: {
    card: 'bg-warn-bg border-[#fde68a] text-warn-text',
    icon: '!',
  },
  error: {
    card: 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]',
    icon: '×',
  },
};

type NotificationCardProps = {
  kind: NotificationKind;
  message: string;
  onDismiss?: () => void;
};

export default function NotificationCard({
  kind,
  message,
  onDismiss,
}: NotificationCardProps) {
  const styles = kindStyles[kind];

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium shadow-sm ${styles.card}`}
      role="status"
    >
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/60 text-[10px] font-bold"
        aria-hidden
      >
        {styles.icon}
      </span>
      <p className="min-w-0 flex-1 leading-snug">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded px-1 text-[10px] font-semibold opacity-60 hover:opacity-100"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      )}
    </div>
  );
}
