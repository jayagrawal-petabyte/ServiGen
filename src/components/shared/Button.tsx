import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-[#E87A5D] hover:bg-[#D96A4C] text-white shadow-xs',
    secondary: 'bg-[#1B254B] hover:bg-[#141C3A] text-white',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 bg-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-4 py-2 text-xs font-semibold',
    lg: 'px-5 py-2.5 text-sm font-semibold',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export default Button;
