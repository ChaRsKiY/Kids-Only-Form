import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
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
    options,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      'flex w-full rounded-md border border-gray-200 bg-white text-foreground',
      'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors duration-200',
      'appearance-none',
      {
        // Size variants
        'h-8 px-3 text-sm': inputSize === 'sm',
        'h-10 px-4 py-2 text-base': inputSize === 'md',
        'h-12 px-6 py-3 text-[1.1rem]': inputSize === 'lg',
        
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
          <label
            className="block text-sm font-medium text-muted-foreground mb-2"
            htmlFor={(props as any).id}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <select
            className={baseClasses}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${(props as any).id}-error` : undefined}
            {...props}
          >
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
          
          {/* Default dropdown arrow */}
          {!rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className="mt-1">
            {error && (
              <p id={`${(props as any).id}-error`} className="text-sm text-destructive">{error}</p>
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

Select.displayName = 'Select';

export { Select }; 