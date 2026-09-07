import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-surface border border-white/10 rounded-2xl p-6 shadow-xl text-ivory ${className}`}>
      {children}
    </div>
  );
}
