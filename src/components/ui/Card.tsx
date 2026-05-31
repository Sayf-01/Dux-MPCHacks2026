import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-surface border border-line rounded-3xl shadow-card ${className}`}>
      {children}
    </div>
  );
}
