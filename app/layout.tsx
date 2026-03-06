import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    default: "Gertrude's Children Hospital",
    template: "%s | Gertrude's Children Hospital",
  },
  description:
    'East Africa\'s leading pediatric hospital. Book appointments, track your child\'s care, and stay connected with our medical team.',
  keywords: [
    'pediatric hospital',
    'children healthcare',
    'Nairobi hospital',
    'Gertrude\'s Children Hospital',
    'child doctor',
    'pediatrician Kenya',
  ],
  authors: [{ name: "Gertrude's Children Hospital" }],
  openGraph: {
    title: "Gertrude's Children Hospital",
    description:
      'Trusted pediatric care for Kenyan families since 1947. Book appointments online.',
    type: 'website',
    locale: 'en_KE',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-white text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}