import { cn } from '@/lib/utils'
import React from 'react'

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-textDark',
        'placeholder:text-textMuted',
        'focus:border-softPink focus:ring-2 focus:ring-softPink focus:outline-none',
        className
      )}
      {...props}
    />
  )
})