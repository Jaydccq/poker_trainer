"use client";

import { ButtonHTMLAttributes } from 'react';

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  children: React.ReactNode;
}

export function GameButton({
  variant = 'primary',
  className = '',
  children,
  disabled,
  ...props
}: GameButtonProps) {
  const baseStyles = "relative px-6 py-3 font-bold rounded-xl cursor-pointer transition-opacity duration-200 disabled:opacity-30 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-600 hover:opacity-90 text-white",
    secondary: "bg-gray-600 hover:opacity-90 text-white",
    success: "bg-emerald-600 hover:opacity-90 text-white",
    danger: "bg-red-600 hover:opacity-90 text-white",
    warning: "bg-yellow-600 hover:opacity-90 text-gray-900",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
