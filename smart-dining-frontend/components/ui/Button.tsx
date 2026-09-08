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
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-amber-400/40";
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
  };

  const variantClasses = {
    primary: "bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
    outline: "border border-amber-300 text-amber-700 hover:bg-amber-50",
    destructive: "bg-red-500 hover:bg-red-600 text-white shadow-sm",
    ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-100",
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
