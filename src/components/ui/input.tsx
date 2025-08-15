import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  ref?: React.RefObject<HTMLInputElement>;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    variant = 'default',
    inputSize = 'md',
    disabled,
    placeholder,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      'flex w-full rounded-md border border-gray-200 bg-white text-foreground',
      'placeholder:text-muted-foreground',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors duration-200',
      {
        // Size variants
        'h-8 text-sm px-3': inputSize === 'sm',
        'h-10 text-base px-4 py-2': inputSize === 'md',
        'h-12 text-lg px-6 py-3': inputSize === 'lg',
        
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
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            className={baseClasses}
            ref={ref as React.RefObject<HTMLInputElement>}
            disabled={disabled}
            placeholder={placeholder}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
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

Input.displayName = 'Input';

export { Input };