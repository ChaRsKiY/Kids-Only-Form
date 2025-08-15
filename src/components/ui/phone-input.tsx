import React from 'react';
import PhoneInputBase from 'react-phone-number-input';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = 'Phone number',
  error,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="relative">
        <PhoneInputBase
          international
          defaultCountry="AT"
          value={value}
          onChange={(phoneNumber) => onChange(phoneNumber || '')}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        />
      </div>
      {error && (
        <div className="text-red-500 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}; 