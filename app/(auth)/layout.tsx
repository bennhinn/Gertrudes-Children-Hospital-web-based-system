import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // Let each auth page control its own layout (login wants full-bleed split screen)
    <div className="min-h-screen w-full">
      {children}
    </div>
  )
}
