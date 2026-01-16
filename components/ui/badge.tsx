import { cn } from '@/lib/utils'
import React from 'react'

type Variant = 'blue' | 'pink' | 'green' | 'gray' | 'yellow' | 'red' | 'purple' | 'default' | 'secondary'

const variants: Record<Variant, string> = {
  blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  pink: 'bg-pink-50 text-pink-700 border border-pink-200',
  green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  gray: 'bg-slate-100 text-slate-600 border border-slate-200',
  yellow: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  red: 'bg-red-50 text-red-700 border border-red-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  default: 'bg-blue-600 text-white border border-blue-600',
  secondary: 'bg-slate-100 text-slate-700 border border-slate-200',
}

export function Badge({
  variant = 'gray',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}