import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠', description: 'Overview' },
  { href: '/patients', label: 'Children', icon: '👶', description: 'Manage profiles' },
  { href: '/caregiver-appointments', label: 'Appointments', icon: '📅', description: 'Schedule & view' },
]

export default async function CaregiverLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/login')
  }

  const fullName = (user.user_metadata as { full_name?: string })?.full_name || 'User'
  const email = user.email || 'No email'
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-8 lg:px-8 lg:py-8">
        {/* Sidebar (desktop only) */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-8 space-y-6">
            {/* User info card */}
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-xl font-bold text-white shadow-lg shadow-blue-500/25">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold text-slate-900">{fullName}</div>
                  <div className="truncate text-sm text-slate-500">{email}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                <span className="text-sm">✓</span>
                <span className="text-xs font-medium text-emerald-700">Account verified</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Menu
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-900/5 transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-md hover:ring-blue-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl transition-transform group-hover:scale-110">
                      {item.icon}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                      <div className="text-xs text-slate-500">{item.description}</div>
                    </div>
                    <span className="text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">→</span>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Quick Actions */}
            <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm ring-1 ring-orange-200/50">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-900/70">
                Quick Actions
              </div>
              <div className="space-y-2">
                <Link
                  href="/caregiver-appointments"
                  className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-white hover:shadow-sm"
                >
                  <span>➕</span>
                  <span>New Appointment</span>
                </Link>
                <Link
                  href="/patients"
                  className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-white hover:shadow-sm"
                >
                  <span>👶</span>
                  <span>Add Child</span>
                </Link>
              </div>
            </div>

            {/* Logout */}
            <Button
              variant="secondary"
              className="w-full rounded-2xl border-slate-200 py-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
            >
              <span className="mr-2">👋</span>
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Top header */}
          <header className="sticky top-0 z-40 mb-4 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 lg:mb-6 lg:rounded-3xl lg:border lg:shadow-sm lg:ring-1 lg:ring-slate-900/5">
            <div className="px-4 py-3 lg:px-6 lg:py-4">
              <div className="flex items-center justify-between gap-3 lg:gap-4">
                {/* Mobile: User avatar only (no redundant name) */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-md shadow-blue-500/25 lg:hidden">
                  {initials}
                </div>

                {/* Desktop: Page title area */}
                <div className="hidden lg:block">
                  <h1 className="text-lg font-semibold text-slate-900">Gertrude&apos;s Children Hospital</h1>
                </div>

                <div className="flex items-center gap-3">
                  {/* Primary CTA - Book Appointment (always visible) */}
                  <Link href="/caregiver-appointments" className="hidden sm:block">
                    <Button size="sm" className="shadow-sm lg:h-11 lg:px-4">
                      <span className="mr-1.5 lg:mr-2">📅</span>
                      <span className="font-semibold">Book</span>
                    </Button>
                  </Link>

                  {/* Mobile: Menu/Sign out */}
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 lg:hidden">
                    <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Content with mobile padding */}
          <div className="px-4 pb-24 lg:px-0 lg:pb-8">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-slate-900/5 lg:hidden">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-1 flex-col items-center gap-1 py-3 text-slate-400 transition-all active:scale-95"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl transition-all group-hover:bg-blue-50">
                <span className="text-2xl transition-transform group-hover:scale-110">
                  {item.icon}
                </span>
              </div>
              <span className="text-[11px] font-semibold tracking-tight group-hover:text-slate-700">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}