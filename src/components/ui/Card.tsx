import React from 'react';

interface CardProps {
  variant?: 'glass' | 'elevated' | 'stat';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  glow?: boolean;
}

export function Card({
  variant = 'elevated',
  className = '',
  children,
  onClick,
  glow = false
}: CardProps) {
  const baseStyles = 'rounded-xl p-6 transition-all duration-300';

  const variants = {
    glass: 'bg-[rgba(26,26,46,0.8)] backdrop-blur-md border border-white/10 shadow-xl hover:border-[#7C3AED]/30',
    elevated: 'bg-[#1A1A2E] border border-[#334155] shadow-lg hover:shadow-xl',
    stat: 'bg-[#252542] border border-[#7C3AED]/20 relative overflow-hidden',
  };

  const glowClass = glow ? 'shadow-glow-primary' : '';
  const cursorClass = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${glowClass} ${cursorClass} ${className}`}
      onClick={onClick}
    >
      {variant === 'stat' && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/10 to-transparent" />
      )}
      <div className={variant === 'stat' ? 'relative z-10' : ''}>
        {children}
      </div>
    </div>
  );
}
