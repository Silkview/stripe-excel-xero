import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'xero' | 'success';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-stripe text-white hover:bg-stripe-hover disabled:bg-text-3 disabled:cursor-not-allowed hover:disabled:transform-none hover:disabled:shadow-none',
  ghost:
    'bg-surface text-text-2 border border-border hover:bg-bg hover:text-text disabled:opacity-50',
  xero: 'bg-xero-dark text-white hover:bg-[#0088a8] disabled:bg-text-3 disabled:cursor-not-allowed',
  success:
    'bg-success text-white hover:bg-[#0d8a4f] disabled:bg-text-3 disabled:cursor-not-allowed',
};

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`w-full py-2 px-3.5 rounded-sm border-none font-sans text-[13px] font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 tracking-tight ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
