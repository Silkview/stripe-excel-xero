import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'xero';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  href?: string;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-stripe text-white hover:bg-stripe-hover shadow-lift disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-white text-text border border-border hover:border-stripe/30 hover:text-stripe',
  ghost: 'bg-transparent text-text-2 hover:text-text hover:bg-white/80',
  xero: 'bg-xero-dark text-white hover:bg-xero',
};

export default function Button({
  variant = 'primary',
  className = '',
  children,
  href,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-semibold transition-all ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
