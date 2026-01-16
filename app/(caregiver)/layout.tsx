import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/patients', label: 'Patients' },
  { href: '/caregiver-appointments', label: 'Appointments' },
]

export default async function CaregiverLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    redirect('/login')
  }

  // TODO: Add role check back once roles are configured
  // const role = user.app_metadata?.role || user.user_metadata?.role
  // if (role && role !== 'caregiver') {
  //   redirect('/login')
  // }

  const fullName = (user.user_metadata as { full_name?: string })?.full_name || 'User'
  const email = user.email || 'No email'

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-0 lg:gap-6 lg:px-8 lg:py-6">
        {/* Sidebar (desktop only) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 space-y-4">
            {/* User info card */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-5 shadow-lg">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Signed in as</div>
              <div className="text-lg font-bold text-slate-800">{fullName}</div>
              <div className="text-sm text-slate-600 truncate">{email}</div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-md transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:shadow-lg"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <Button variant="secondary" className="w-full shadow-md">
              Logout
            </Button>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Mobile header */}
          <header className="sticky top-0 z-40 mb-4 flex items-center justify-between bg-white px-4 py-3 shadow-sm lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-lg text-white">
                🏥
              </div>
              <div>
                <div className="text-xs text-slate-500">Caregiver</div>
                <div className="text-sm font-semibold text-slate-800">{fullName}</div>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Logout
            </Button>
          </header>

          {/* Content with mobile padding */}
          <div className="px-4 pb-24 lg:px-0 lg:pb-6">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-slate-500 transition-colors hover:text-blue-600 active:scale-95"
            >
              <span className="text-xl">
                {item.label === 'Dashboard' && '🏠'}
                {item.label === 'Patients' && '👶'}
                {item.label === 'Appointments' && '📅'}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}