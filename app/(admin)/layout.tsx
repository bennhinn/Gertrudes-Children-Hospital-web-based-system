'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ADMIN_NAV_ITEMS = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/users', icon: '👥', label: 'Users' },
  { href: '/admin/staff', icon: '👨‍⚕️', label: 'Staff' },
  { href: '/admin/appointments', icon: '📅', label: 'Appointments' },
  { href: '/admin/reports', icon: '📈', label: 'Reports' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ fullName: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (!user || error) {
        router.push('/login')
        return
      }

      const role = user.app_metadata?.role || user.user_metadata?.role
      if (role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser({
        fullName: user.user_metadata?.full_name || 'Admin',
        email: user.email || '',
      })
      setLoading(false)
    }

    checkAuth()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-xl lg:block">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl">
            ⚙️
          </div>
          <div>
            <p className="font-bold text-lg">GCH Admin</p>
            <p className="text-xs text-slate-400">System Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <ul className="space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 rounded-lg bg-slate-700/50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold">
              {user?.fullName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200 bg-white shadow-sm lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-lg">
              ⚙️
            </div>
            <span className="font-bold text-slate-800">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-14 pb-20 px-4 lg:ml-64 lg:pt-0 lg:pb-0 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex justify-around py-2">
          {ADMIN_NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px] ${isActive ? 'text-blue-600' : 'text-slate-500'
                  }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

