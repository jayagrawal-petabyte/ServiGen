import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-all cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
