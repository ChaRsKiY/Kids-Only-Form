import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'error';
  size?: 'sm' | 'md' | 'lg';
  onChange?: (checked: boolean) => void;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  className,
  label,
  error,
  helperText,
  variant = 'default',
  size = 'md',
  disabled,
  onChange,
  checked,
  ...props
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5'
  };

  const labelSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="relative flex items-center h-full">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'appearance-none rounded border-2 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            sizeClasses[size],
            // Border colors
            variant === 'error' 
              ? 'border-destructive focus:ring-destructive' 
              : 'border-gray-300 focus:ring-primary',
            // Background colors
            checked 
              ? variant === 'error'
                ? 'bg-destructive border-destructive'
                : 'bg-primary border-primary'
              : 'bg-white',
            // Disabled state
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {checked && (
          <svg
            className={cn(
              'absolute inset-0 m-auto text-white pointer-events-none',
              iconSizeClasses[size]
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      
      {(label || helperText || error) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={props.id}
              className={cn(
                'font-medium text-foreground cursor-pointer',
                labelSizeClasses[size],
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {label}
            </label>
          )}
          
          {(helperText || error) && (
            <p
              className={cn(
                'mt-1 text-sm',
                error 
                  ? 'text-red-600' 
                  : 'text-muted-foreground'
              )}
            >
              {error || helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox }; 