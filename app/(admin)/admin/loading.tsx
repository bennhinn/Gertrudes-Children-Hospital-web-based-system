import { Shield } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" role="status" aria-label="Loading admin content">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-slate-200 animate-pulse" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-200 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-20 rounded-lg bg-slate-100 animate-pulse" />
                <div className="h-6 w-16 rounded-lg bg-slate-200 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-64 rounded-xl bg-slate-200 animate-pulse" />
            <div className="h-10 w-32 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        </div>
        {/* Table rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-b-0"
          >
            <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded-lg bg-slate-200 animate-pulse" />
              <div className="h-3 w-24 rounded-lg bg-slate-100 animate-pulse" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading admin content, please wait...</span>
    </div>
  )
}
