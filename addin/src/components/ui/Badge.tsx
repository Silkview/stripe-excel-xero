interface BadgeProps {
  variant?: 'success' | 'warn';
  children: string;
}

export default function Badge({ variant = 'success', children }: BadgeProps) {
  const styles =
    variant === 'success'
      ? 'bg-success-bg text-success'
      : 'bg-warn-bg text-warn';

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${styles}`}
    >
      {children}
    </span>
  );
}
