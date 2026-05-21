interface ResultBarProps {
  variant: 'success' | 'warn';
  children: string;
  className?: string;
}

export default function ResultBar({
  variant,
  children,
  className = '',
}: ResultBarProps) {
  const styles =
    variant === 'success'
      ? 'bg-success-bg text-success-text'
      : 'bg-warn-bg text-warn-text';

  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-2 rounded-sm text-[11px] font-medium mt-2 ${styles} ${className}`}
      role="status"
    >
      {children}
    </div>
  );
}
