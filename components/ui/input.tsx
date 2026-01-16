import { cn } from '@/lib/utils'
import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, Props>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-800',
        'placeholder:text-slate-400',
        'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
        'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
        'transition-shadow',
        // Mobile: prevent zoom on iOS by using 16px font
        'text-[16px] sm:text-sm',
        className
      )}
      {...props}
    />
  )
})