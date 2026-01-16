import { cn } from '@/lib/utils'
import React from 'react'

type Props = React.SelectHTMLAttributes<HTMLSelectElement>

export const Select = React.forwardRef<HTMLSelectElement, Props>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-textDark',
        'focus:border-softPink focus:ring-2 focus:ring-softPink focus:outline-none',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
})