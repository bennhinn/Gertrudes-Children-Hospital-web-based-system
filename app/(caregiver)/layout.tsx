import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'
import { logActivityServer } from '@/lib/activity-logger'
import { CaregiverBottomNav } from '@/components/caregiver-bottom-nav'
import CaregiverHeader from '@/components/caregiver-header'
import { CaregiverSidebarNav } from '@/components/caregiver-sidebar-nav'
import './clay-caregiver.css'
import {
  Users,
  Plus,
  LogOut,
  Shield,
  FileText,
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
    <>
    <div className="clay-caregiver" style={{ position: 'relative' }}>
      {/* Decorative blobs */}
      <div className="deco-blob hidden lg:block" style={{ width: 340, height: 340, top: 60, right: -80, background: 'radial-gradient(circle, rgba(99,102,241,.06), transparent 70%)', animationDelay: '0s' }} aria-hidden="true" />
      <div className="deco-blob hidden lg:block" style={{ width: 280, height: 280, bottom: 120, left: -60, background: 'radial-gradient(circle, rgba(6,182,212,.06), transparent 70%)', animationDelay: '3s' }} aria-hidden="true" />

      <div className="relative z-1 mx-auto flex max-w-7xl gap-0 lg:gap-8 lg:px-8 lg:py-8">
        {/* Sidebar (desktop only) */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-8 space-y-5">
            {/* User info card */}
            <div className="clay-sidebar-card p-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="clay-avatar flex h-14 w-14 shrink-0 items-center justify-center text-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', boxShadow: '0 4px 0 rgba(99,102,241,.3), 0 6px 16px rgba(99,102,241,.2), inset 0 1px 0 rgba(255,255,255,.4)', borderRadius: '18px' }}>
                    {initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white" style={{ background: '#10B981', boxShadow: '0 2px 6px rgba(16,185,129,.4)' }}>
                    <span className="live-dot absolute inset-0 rounded-full" style={{ background: '#10B981' }} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-bold" style={{ color: 'var(--clay-text-dark)', fontFamily: "'Nunito', sans-serif" }}>{fullName}</div>
                  <div className="truncate text-sm" style={{ color: 'var(--clay-text-muted)' }}>{email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Shield className="h-3 w-3" style={{ color: '#10B981' }} />
                    <span className="text-xs font-bold" style={{ color: '#10B981' }}>Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation — Client Component with active state */}
            <CaregiverSidebarNav />

            {/* Quick Actions */}
            <div className="clay-inset p-5">
              <div className="clay-label" style={{ color: 'var(--clay-indigo)' }}>
                Quick Actions
              </div>
              <div className="space-y-2 mt-3">
                <Link href="/caregiver-appointments" className="clay-quick-action flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold" style={{ color: 'var(--clay-text-dark)' }}>
                  <div className="clay-ico" style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #6366F1, #818CF8)', boxShadow: '0 3px 0 rgba(99,102,241,.25), 0 5px 12px rgba(99,102,241,.15), inset 0 1px 0 rgba(255,255,255,.4)' }}>
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <span>New Appointment</span>
                </Link>
                <Link href="/patients" className="clay-quick-action flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold" style={{ color: 'var(--clay-text-dark)' }}>
                  <div className="clay-ico" style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #06B6D4, #22D3EE)', boxShadow: '0 3px 0 rgba(6,182,212,.25), 0 5px 12px rgba(6,182,212,.15), inset 0 1px 0 rgba(255,255,255,.4)' }}>
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span>Add Child</span>
                </Link>
                <Link href="/caregiver-health-records" className="clay-quick-action flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold" style={{ color: 'var(--clay-text-dark)' }}>
                  <div className="clay-ico" style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #10B981, #34D399)', boxShadow: '0 3px 0 rgba(16,185,129,.25), 0 5px 12px rgba(16,185,129,.15), inset 0 1px 0 rgba(255,255,255,.4)' }}>
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <span>Health Records</span>
                </Link>
              </div>
            </div>

            {/* Logout */}
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="clay-btn-sec flex w-full items-center justify-center gap-2 px-4 py-3 text-sm" style={{ color: 'var(--clay-text-mid)' }}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
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

    </div>

    {/* Bottom nav lives OUTSIDE the clay-caregiver wrapper so position:fixed is always relative to viewport */}
    <CaregiverBottomNav />
    </>
  )
}