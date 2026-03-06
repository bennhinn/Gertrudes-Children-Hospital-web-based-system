'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console in development, monitoring service in production
    console.error('[Admin Error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4" role="alert">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-2xl bg-red-500 opacity-15 blur-xl animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Something went wrong</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            An unexpected error occurred in the admin panel. This has been logged for investigation.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 font-mono mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Error details (collapsed) */}
        <details className="rounded-xl border border-slate-200 bg-slate-50/50 text-left">
          <summary className="px-4 py-3 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900 transition-colors">
            Technical details
          </summary>
          <div className="px-4 pb-3 border-t border-slate-200">
            <pre className="mt-2 text-xs text-red-600 font-mono whitespace-pre-wrap wrap-break-word max-h-32 overflow-y-auto">
              {error.message}
            </pre>
          </div>
        </details>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
