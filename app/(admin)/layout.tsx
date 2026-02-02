'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserCog,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  ChevronRight
} from 'lucide-react'

const ADMIN_NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/staff', icon: UserCog, label: 'Staff' },
  { href: '/admin/appointments', icon: CalendarDays, label: 'Appointments' },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { href: '/settings', icon: Settings, label: 'Settings' },
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

      // FIX: Get role from profiles table instead of app_metadata
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser({
        fullName: profile.full_name || user.user_metadata?.full_name || 'Admin',
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
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20 blur-xl animate-pulse"></div>
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Shield className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-1.5 w-32 mx-auto rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-[loading_1s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-sm text-slate-500 font-medium">Loading admin panel...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xl lg:block">
        {/* Logo */}
        <div className="flex h-20 items-center gap-4 px-6 border-b border-slate-100">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 opacity-20 blur-lg"></div>
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <p className="font-bold text-lg text-slate-900">GCH Admin</p>
            <p className="text-xs text-slate-500 font-medium">System Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <p className="px-4 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
          <ul className="space-y-1.5">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                  >
                    <Icon className={`h-5 w-5 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`} />
                    <span className="font-medium flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm border border-slate-100">
            <div className="relative">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-bold text-white shadow-md">
                {user?.fullName?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900">Admin</span>
              <p className="text-[10px] text-slate-500 font-medium">GCH Panel</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-28 px-4 lg:ml-72 lg:pt-8 lg:pb-8 lg:px-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-6 py-1.5 px-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all duration-200 ${isActive
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {isActive && (
                  <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"></span>
                )}
                <Icon className={`h-5 w-5 transition-transform ${isActive && 'scale-110'}`} />
                <span className={`text-[9px] font-medium ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {item.label.length > 8 ? item.label.slice(0, 7) : item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}