import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-slate-900 ${className}`}>
      {children}
    </div>
  );
}
