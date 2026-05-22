type AlertVariant = 'error' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
}

const styles: Record<AlertVariant, string> = {
  error: 'bg-warn-bg text-warn-text border-warn/20',
  success: 'bg-success-bg text-success-text border-success/20',
  info: 'bg-stripe-light text-stripe border-stripe/20',
};

export default function Alert({ variant = 'info', children }: AlertProps) {
  return (
    <div className={`rounded-sm border px-3 py-2.5 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
}
