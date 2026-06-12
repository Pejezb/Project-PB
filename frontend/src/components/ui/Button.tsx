import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2',
        // Tamaños
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        // Variantes
        variant === 'primary'   && 'bg-green-700 text-white hover:bg-green-800 focus-visible:outline-green-700 disabled:opacity-50 disabled:cursor-not-allowed',        variant === 'secondary' && 'bg-white text-text border border-border hover:bg-gray-50 focus-visible:outline-primary disabled:opacity-50',
        variant === 'danger'    && 'bg-error text-white hover:bg-red-700 focus-visible:outline-error disabled:opacity-50',
        variant === 'ghost'     && 'bg-transparent text-text-muted hover:text-text hover:bg-gray-100 focus-visible:outline-primary',
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}
