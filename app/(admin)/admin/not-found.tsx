'use client'

import { SearchX, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* 404 icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500 opacity-15 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
            <SearchX className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <p className="text-6xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-purple-600" aria-hidden="true">
            404
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            The admin page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => history.back()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    </main>
  )
}
