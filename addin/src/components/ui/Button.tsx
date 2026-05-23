import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'build' | 'push' | 'ghost' | 'xero' | 'success';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-stripe text-white hover:bg-stripe-hover hover:shadow-[0_4px_14px_rgba(99,91,255,0.28)] disabled:bg-[#c0c4d0] disabled:cursor-not-allowed disabled:shadow-none',
  build:
    'bg-accent text-white hover:bg-accent-hover hover:shadow-[0_4px_14px_rgba(37,99,235,0.28)] disabled:bg-[#c0c4d0] disabled:cursor-not-allowed disabled:shadow-none',
  push:
    'bg-xero text-white hover:bg-xero-dark hover:shadow-[0_4px_14px_rgba(6,179,232,0.3)] disabled:bg-[#c0c4d0] disabled:cursor-not-allowed disabled:shadow-none',
  ghost:
    'bg-surface text-ink-2 border border-border hover:bg-bg hover:border-[#c5cbda] disabled:opacity-50',
  xero: 'bg-xero text-white hover:bg-xero-dark disabled:bg-[#c0c4d0] disabled:cursor-not-allowed',
  success:
    'bg-success text-white hover:bg-[#15803d] disabled:bg-[#c0c4d0] disabled:cursor-not-allowed',
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
      className={`w-full py-2.5 px-3.5 rounded border-none font-sans text-[13.5px] font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 tracking-tight ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
