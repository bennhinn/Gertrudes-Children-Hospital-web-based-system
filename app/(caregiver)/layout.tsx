import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'
import { logActivityServer } from '@/lib/activity-logger'
import { Button } from '@/components/ui/button'
import { CaregiverBottomNav } from '@/components/caregiver-bottom-nav'
import CaregiverHeader from '@/components/caregiver-header'
import { CaregiverSidebarNav } from '@/components/caregiver-sidebar-nav'
import {
  Home,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  Bell,
  Plus,
  LogOut,
  Receipt,
  ChevronRight,
  Shield,
  FileText,
  Activity
} from 'lucide-react'

export default async function CaregiverLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/login')
  }

  // Log caregiver layout/page view on the server (non-blocking errors handled by logger)
  try {
    await logActivityServer(supabase, {
      user_id: user.id,
      user_email: user.email,
      user_role: (user.user_metadata as any)?.role || null,
      action: 'caregiver_layout_view',
      resource_name: 'caregiver_layout',
      description: 'Caregiver layout rendered (page view)'
    }, { autoUser: false })
  } catch (e) {
    // swallow - logger already logs errors to console
  }

  const fullName = (user.user_metadata as { full_name?: string })?.full_name || 'User'
  const email = user.email || 'No email'
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-dvh bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-8 lg:px-8 lg:py-8">
        {/* Sidebar (desktop only) */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-8 space-y-6">
            {/* User info card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-cyan-500 text-xl font-bold text-white shadow-lg shadow-blue-500/25">
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold text-slate-900">{fullName}</div>
                  <div className="truncate text-sm text-slate-500">{email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-600">Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation — Client Component with active state */}
            <CaregiverSidebarNav />

            {/* Quick Actions */}
            <div className="rounded-2xl bg-linear-to-br from-blue-50 to-cyan-50 p-5 ring-1 ring-blue-100">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-900/70">
                Quick Actions
              </div>
              <div className="space-y-2">
                <Link
                  href="/caregiver-appointments"
                  className="flex items-center gap-2.5 rounded-xl bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-white/50 transition-all duration-150 hover:bg-white hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span>New Appointment</span>
                </Link>
                <Link
                  href="/patients"
                  className="flex items-center gap-2.5 rounded-xl bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-white/50 transition-all duration-150 hover:bg-white hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                    <Users className="h-4 w-4" />
                  </div>
                  <span>Add Child</span>
                </Link>
                <Link
                  href="/caregiver-health-records"
                  className="flex items-center gap-2.5 rounded-xl bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-white/50 transition-all duration-150 hover:bg-white hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span>Health Records</span>
                </Link>
              </div>
            </div>

            {/* Logout */}
            <form action="/api/auth/logout" method="POST">
              <Button
                type="submit"
                variant="ghost"
                className="w-full rounded-xl border border-slate-200 py-5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Top header with hamburger menu */}
          <CaregiverHeader fullName={fullName} email={email} initials={initials} />

          {/* Content with mobile padding */}
          <div className="px-4 pb-28 lg:px-0 lg:pb-8">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation with animations */}
      <CaregiverBottomNav />
    </div>
  )
}