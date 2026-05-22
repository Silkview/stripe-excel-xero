import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="light min-h-screen bg-bg text-text" style={{ colorScheme: 'light' }}>
      {children}
    </div>
  );
}
