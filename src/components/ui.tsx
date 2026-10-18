import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'mango' | 'clay' | 'mint' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-nile-700 text-white shadow-soft',
  mango: 'bg-mango-500 text-nile-900 shadow-pop',
  clay: 'bg-clay-500 text-white shadow-pop',
  mint: 'bg-mint-500 text-white shadow-soft',
  ghost: 'bg-white/80 text-nile-700 border-2 border-nile-200',
  danger: 'bg-clay-500 text-white shadow-pop',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-5 py-3 text-base rounded-2xl',
  lg: 'px-6 py-4 text-lg rounded-2xl',
  xl: 'px-8 py-5 text-xl rounded-blob',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.94 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      className={`min-h-11 font-extrabold tracking-tight transition-colors select-none ${variants[variant]} ${sizes[size]} ${
        disabled ? 'opacity-50 grayscale' : ''
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  if (onClick) return (
    <motion.button type="button" onClick={onClick} whileTap={{ scale: 0.97 }} className={`surface-card w-full text-start rounded-3xl p-4 ${className}`}>
      {children}
    </motion.button>
  );
  return (
    <motion.div
      className={`surface-card rounded-3xl p-4 ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: 'nile' | 'mango' | 'clay' | 'mint' | 'berry';
}

export function Badge({ children, color = 'nile' }: BadgeProps) {
  const colors: Record<string, string> = {
    nile: 'bg-nile-100 text-nile-700',
    mango: 'bg-mango-100 text-nile-900',
    clay: 'bg-clay-100 text-clay-700',
    mint: 'bg-mint-500/15 text-mint-600',
    berry: 'bg-berry-500/15 text-berry-500',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[color]}`}>
      {children}
    </span>
  );
}

interface ProgressBarProps {
  value: number; // 0..1
  color?: 'nile' | 'mango' | 'clay' | 'mint';
  className?: string;
}

export function ProgressBar({ value, color = 'nile', className = '' }: ProgressBarProps) {
  const colors: Record<string, string> = {
    nile: 'bg-nile-500',
    mango: 'bg-mango-500',
    clay: 'bg-clay-500',
    mint: 'bg-mint-500',
  };
  return (
    <div role="meter" aria-label="Progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0, Math.min(1, value)) * 100)} className={`w-full h-3 rounded-full bg-sand-200 overflow-hidden ${className}`}>
      <motion.div
        className={`h-full rounded-full ${colors[color]}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}
