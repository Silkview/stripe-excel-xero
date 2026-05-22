import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="block text-sm font-medium text-text mb-1.5">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-sm border border-border bg-white px-3 py-2.5 text-sm text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-stripe/25 focus:border-stripe ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-warn">{error}</p>}
    </div>
  );
}
