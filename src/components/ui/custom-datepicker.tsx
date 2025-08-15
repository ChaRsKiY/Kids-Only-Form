import { MdOutlineDateRange } from "react-icons/md";
import React from "react";
import { Input } from "./input";

type CustomDateInputProps = {
    value?: string;
    onClick?: () => void;
    placeholder?: string;
    inputSize?: 'sm' | 'md' | 'lg';
  };
  const CustomDateInput = React.forwardRef<HTMLButtonElement, CustomDateInputProps>(({ value, onClick, placeholder, inputSize }, ref) => (
    <Input
      type="text"
      ref={ref as React.RefObject<HTMLInputElement>}
      onClick={onClick}
      tabIndex={0}
      rightIcon={<MdOutlineDateRange />}
      className="w-full"
      value={value}
      placeholder={placeholder}
      inputSize={inputSize}
    />
  ));
  CustomDateInput.displayName = 'CustomDateInput';  

  export default CustomDateInput;