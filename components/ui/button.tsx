import { cn } from '@/lib/utils'
import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' 
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const base =
  'btn-focus inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] touch-manipulation'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-blue-700 active:bg-blue-800',
  secondary:
    'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100',
  ghost: 'text-primary hover:bg-blue-50 active:bg-blue-100',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm min-h-[40px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[48px]',
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
}