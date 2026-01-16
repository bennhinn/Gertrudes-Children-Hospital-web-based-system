'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const navItems = [
    { href: '/receptionist', label: 'Dashboard', icon: '🏠' },
    { href: '/receptionist/queue', label: 'Queue Management', icon: '📋' },
    { href: '/receptionist/check-in', label: 'Check-In', icon: '📱' },
    { href: '/receptionist/appointments', label: 'Appointments', icon: '📅' },
]

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
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

            // Check role
            const role = user.app_metadata?.role || user.user_metadata?.role
            if (role !== 'receptionist' && role !== 'admin') {
                router.push('/login')
                return
            }

            setUser({
                fullName: user.user_metadata?.full_name || 'Receptionist',
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
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="text-slate-600">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[100dvh] bg-slate-50">
            {/* Top Header */}
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-lg sm:text-xl shadow-md">
                            🏥
                        </div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-slate-800">Reception</h1>
                            <p className="hidden sm:block text-xs text-slate-500">Gertrude's Children Hospital</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Live indicator */}
                        <div className="hidden items-center gap-2 rounded-full bg-green-50 px-2.5 py-1 sm:px-3 sm:py-1.5 sm:flex">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                            </span>
                            <span className="text-xs font-medium text-green-700">Live</span>
                        </div>

                        {/* User info */}
                        <div className="hidden text-right md:block">
                            <p className="text-sm font-medium text-slate-700">{user?.fullName}</p>
                            <p className="text-xs text-slate-500">Receptionist</p>
                        </div>

                        <Button variant="secondary" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 lg:px-8">
                <div className="flex gap-6">
                    {/* Sidebar Navigation */}
                    <aside className="hidden w-64 shrink-0 lg:block">
                        <nav className="sticky top-24 space-y-2">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                            : 'bg-white text-slate-700 shadow-sm hover:bg-blue-50 hover:shadow-md'
                                            }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
                <div className="flex justify-around py-1.5 sm:py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px] ${isActive ? 'text-blue-600' : 'text-slate-500'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-[10px] sm:text-xs font-medium">{item.label.split(' ')[0]}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
