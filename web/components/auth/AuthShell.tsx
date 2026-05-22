import type { ReactNode } from 'react';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4 py-12">
      <a href="/" className="mb-8 text-lg font-bold text-text tracking-tight">
        Silkview <span className="text-stripe">Sync</span>
      </a>
      <div className="w-full max-w-md bg-surface rounded shadow-card border border-border/80 p-8">
        <h1 className="text-xl font-bold text-text">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-text-2">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && (
          <div className="mt-6 pt-6 border-t border-border text-sm text-text-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
