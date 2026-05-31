import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-default';
  const variants = {
    primary:
      'bg-accent text-white rounded-full shadow-btn hover:-translate-y-0.5 hover:shadow-btn-hover active:translate-y-1 active:shadow-none px-6 py-3 disabled:transform-none disabled:shadow-btn',
    ghost:
      'bg-surface border border-line-2 text-ink rounded-full hover:border-accent hover:-translate-y-0.5 px-4 py-2.5 shadow-card-sm text-sm',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
