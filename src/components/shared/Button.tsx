import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[#C96F55] hover:bg-[#B55F46] text-white shadow-xs font-bold active:bg-[#9F4F39]',
    secondary: 'bg-[#263B5E] hover:bg-[#1D2D48] text-white shadow-xs font-bold',
    outline: 'border border-[#ebdcd3] hover:bg-[#FFF9F5] text-[#332B28] bg-white font-semibold',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white font-semibold',
  };

  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs font-semibold',
    lg: 'px-5 py-2.5 text-sm font-semibold',
  };

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.97 } : {}}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap select-none disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        icon && <span className="shrink-0 flex items-center">{icon}</span>
      )}
      {children}
    </motion.button>
  );
};

export default Button;
