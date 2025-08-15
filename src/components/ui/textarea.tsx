import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    variant = 'default',
    inputSize = 'md',
    disabled,
    rows = 3,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      'flex w-full rounded-md border border-gray-200 bg-white text-foreground',
      'placeholder:text-muted-foreground',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors duration-200',
      'resize-none',
      {
        // Size variants
        'text-sm px-3 py-2': inputSize === 'sm',
        'text-base px-4 py-3': inputSize === 'md',
        'text-lg px-5 py-4': inputSize === 'lg',
        
        // Variant styles
        'border-gray-200 bg-white': variant === 'default',
        'border-gray-200 bg-muted': variant === 'filled',
        'border-2 border-gray-200 bg-transparent': variant === 'outlined',
        
        // Error state
        'border-destructive focus:ring-destructive focus:border-destructive': error,
        
        // Icon padding
        'pl-10': leftIcon,
        'pr-10': rightIcon,
      },
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-3 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <textarea
            className={baseClasses}
            ref={ref}
            disabled={disabled}
            rows={rows}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-3 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className="mt-1">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {helperText && !error && (
              <p className="text-sm text-muted-foreground">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea }; 