import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AlertProps {
  type?: 'error' | 'success' | 'info';
  title?: string;
  message: string;
  className?: string;
}

export function Alert({ type = 'error', title, message, className = '' }: AlertProps) {
  const styles = {
    error: 'bg-occupied-red/10 border-occupied-red/30 text-rose-200 icon-occupied-red',
    success: 'bg-free-green/10 border-free-green/30 text-emerald-200 icon-free-green',
    info: 'bg-amber-glow/10 border-amber-glow/30 text-amber-200 icon-amber-glow',
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5 text-occupied-red shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="w-5 h-5 text-free-green shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-amber-glow shrink-0 mt-0.5" />,
  };

  return (
    <div className={`p-4 border rounded-xl flex items-start space-x-3 text-sm ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="flex-1">
        {title && <h5 className="font-semibold text-white mb-0.5">{title}</h5>}
        <p className="font-medium text-xs leading-relaxed">{message}</p>
      </div>
    </div>
  );
}
