import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive-ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    leftIcon, 
    rightIcon, 
    loading = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center rounded-md font-medium transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      {
        // Size variants
        'h-8 px-3 text-sm': size === 'sm',
        'h-10 px-4 py-2 text-base': size === 'md',
        'h-12 px-6 py-3 text-lg': size === 'lg',
        
        // Variant styles
        'bg-primary text-primary-foreground hover:bg-secondary': variant === 'default',
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive': variant === 'destructive',
        'border border-gray-200 bg-white text-foreground hover:bg-muted': variant === 'outline',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
        'text-foreground hover:bg-muted': variant === 'ghost',
        'text-primary underline-offset-4 hover:underline': variant === 'link',
        'text-destructive hover:bg-destructive/10 focus:ring-destructive focus:ring-offset-2': variant === 'destructive-ghost',
      },
      className
    );

    return (
      <button
        className={baseClasses}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button }; 