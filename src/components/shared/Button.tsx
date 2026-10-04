import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'px-4 py-2 rounded-full font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer';
  const variantStyles = {
    primary: 'bg-[#E87A5D] hover:bg-[#D96A4C] text-white shadow-xs',
    secondary: 'bg-[#1B254B] hover:bg-[#141C3A] text-white',
    outline: 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
