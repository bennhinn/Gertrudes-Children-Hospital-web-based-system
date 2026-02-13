'use client'

import './mobile.css'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity-logger'
import {
    LayoutDashboard,
    UserCheck,
    ListOrdered,
    Calendar,
    MessageSquare,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronRight,
    Activity,
    User,
    Building2,
    Clock
} from 'lucide-react'

const navItems = [
    { href: '/receptionist', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/receptionist/check-in', label: 'Check-In', icon: UserCheck },
    { href: '/receptionist/queue', label: 'Queue', icon: ListOrdered },
    { href: '/receptionist/appointments', label: 'Appointments', icon: Calendar },
    { href: '/receptionist/messages', label: 'Messages', icon: MessageSquare },
]

export default function ReceptionistLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<{ fullName: string; email: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [notifications] = useState(4)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        async function checkAuth() {
            const supabase = createClient()
            const { data: { user }, error } = await supabase.auth.getUser()

            if (!user || error) {
                router.push('/login')
                return
            }

            const role = user.app_metadata?.role || user.user_metadata?.role
            if (role !== 'receptionist' && role !== 'reception' && role !== 'admin') {
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

    // Log receptionist area view once auth finished
    useEffect(() => {
        if (!loading) {
            // non-blocking log
            logActivity({
                action: 'receptionist_view',
                description: `Visited receptionist area: ${pathname}`,
                metadata: { pathname },
            }).catch(() => {})
        }
    }, [loading, pathname])

    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    async function handleLogout() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50">
                <div className="text-center">
                    <div className="relative mx-auto mb-6 h-16 w-16">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20 blur-xl animate-pulse"></div>
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                            <Building2 className="h-8 w-8 text-white animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-1.5 w-32 mx-auto rounded-full bg-blue-100 overflow-hidden">
                            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-[loading_1s_ease-in-out_infinite]"></div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Loading Reception...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="receptionist-root min-h-dvh bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-blue-100 bg-white/80 backdrop-blur-xl lg:block">
                <div className="flex h-full flex-col">
                    {/* Logo Section */}
                    <div className="flex h-16 items-center gap-3 border-b border-blue-100 px-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-200">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">Reception</p>
                            <p className="text-xs text-slate-500">GCH Front Desk</p>
                        </div>
                    </div>

                    {/* Time Display */}
                    <div className="border-b border-blue-100 px-6 py-3">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs text-slate-400">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1.5 p-4">
                        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Menu</p>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-200'
                                        : 'hover:bg-blue-50'
                                        }`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <Icon className={`transition-all duration-200 ${isActive ? 'h-6 w-6 text-white' : 'h-5 w-5 text-slate-600 group-hover:text-blue-700 group-hover:scale-110'}`} />
                                    <span className={`flex-1 ${isActive ? 'text-white font-bold text-base' : 'text-slate-600 text-sm font-medium group-hover:text-blue-700'}`}>{item.label}</span>
                                    {item.label === 'Queue' && notifications > 0 && (
                                        <span className={`flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {notifications}
                                        </span>
                                    )}
                                    {isActive && <ChevronRight className="h-4 w-4 text-white opacity-70" />}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="border-t border-blue-100 p-4">
                        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">{user?.fullName}</p>
                                <p className="truncate text-xs text-slate-500">Front Desk</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white hover:text-red-500"
                                title="Logout"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white shadow-sm lg:hidden">
                <div className="flex h-14 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-800">Reception</p>
                            <p className="text-[11px] text-slate-500">GCH Front Desk</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors active:bg-slate-200">
                            <Bell className="h-5 w-5" />
                            {notifications > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                    {notifications}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors active:bg-slate-200"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-white shadow-2xl">
                        {/* Drawer Header */}
                        <div className="sticky top-0 flex h-16 items-center justify-between border-b border-blue-100 bg-white px-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                                    <Building2 className="h-4 w-4 text-white" />
                                </div>
                                <span className="font-bold text-slate-800">Menu</span>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="border-b border-blue-100 p-4">
                            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{user?.fullName}</p>
                                    <p className="text-sm text-slate-500">Front Desk</p>
                                </div>
                            </div>
                        </div>

                        {/* Time Display */}
                        <div className="border-b border-blue-100 px-4 py-3">
                            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">
                                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="p-4">
                            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Navigation</p>
                            <div className="space-y-1.5">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href
                                    const Icon = item.icon
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${isActive
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg'
                                                : 'text-slate-600 hover:bg-blue-50'
                                                }`}
                                            style={isActive ? { color: '#ffffff' } : undefined}
                                        >
                                            <Icon className={`transition-all ${isActive ? 'h-6 w-6 text-white' : 'h-5 w-5 text-slate-600'}`} />
                                            <span className={`flex-1 ${isActive ? 'text-white font-bold text-base' : ''}`}>{item.label}</span>
                                            {item.label === 'Queue' && notifications > 0 && (
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {notifications}
                                                </span>
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </nav>

                        {/* Logout */}
                        <div className="absolute inset-x-0 bottom-0 border-t border-blue-100 bg-white p-4 pb-safe">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
                            >
                                <LogOut className="h-5 w-5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="pt-14 pb-24 lg:pb-8 lg:pl-72 lg:pt-0">
                <div className="p-4 lg:p-6">{children}</div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-safe lg:hidden">
                <div className="flex items-center">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                            >
                                <div className="relative">
                                    <Icon className={`h-6 w-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                    {item.label === 'Queue' && notifications > 0 && (
                                        <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                                            {notifications > 9 ? '9+' : notifications}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
