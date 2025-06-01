// components/ui/Button.tsx
'use client';

import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'success' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

const sizes = {
  xs: 'px-1 py-0.5 text-xs sm:px-2 sm:py-1 sm:text-xs',
  sm: 'px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm',
  md: 'px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-base',
  lg: 'px-4 py-2 text-base sm:px-6 sm:py-3 sm:text-lg',
};

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  danger: 'bg-red-500 text-white hover:bg-red-700 focus:ring-red-400',
  ghost:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300 border border-transparent',

  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  outline: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100 focus:ring-gray-400',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  ...props
}: ButtonProps) {
  return (
    <button {...props} className={clsx(base, sizes[size], variants[variant], className)}>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
