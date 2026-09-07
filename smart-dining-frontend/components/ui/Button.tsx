import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
  };

  const variantClasses = {
    primary: "bg-ember hover:bg-rust text-white shadow-lg shadow-ember/20 border border-ember/30",
    secondary: "bg-surface-light hover:bg-surface text-ivory border border-white/10",
    outline: "border border-ember/40 text-ember hover:bg-ember/10",
    destructive: "bg-occupied-red hover:bg-rose-700 text-white shadow-md shadow-occupied-red/20",
    ghost: "text-muted hover:text-ivory hover:bg-white/5",
  };

  return (
    <button
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
