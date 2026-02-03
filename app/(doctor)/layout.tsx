'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Users,
    Stethoscope,
    Calendar,
    MessageSquare,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronRight,
    Activity,
    User
} from 'lucide-react'

const navItems = [
    { href: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/queue', label: 'Patient Queue', icon: Users },
    { href: '/doctor/consultations', label: 'Consultations', icon: Stethoscope },
    { href: '/doctor/schedule', label: 'My Schedule', icon: Calendar },
    { href: '/doctor/messages', label: 'Messages', icon: MessageSquare },
]

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<{ fullName: string; email: string; specialization?: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [notifications] = useState(3)

    useEffect(() => {
        async function checkAuth() {
            const supabase = createClient()
            const { data: { user }, error } = await supabase.auth.getUser()

            if (!user || error) {
                router.push('/login')
                return
            }

            const role = user.app_metadata?.role || user.user_metadata?.role
            if (role !== 'doctor' && role !== 'admin') {
                router.push('/login')
                return
            }

            const { data: doctorData } = await supabase
                .from('doctors')
                .select('specialization')
                .eq('user_id', user.id)
                .single()

            setUser({
                fullName: user.user_metadata?.full_name || 'Doctor',
                email: user.email || '',
                specialization: doctorData?.specialization || 'General Practice',
            })
            setLoading(false)
        }

        checkAuth()
    }, [router])

    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    async function handleLogout() {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
                <div className="text-center">
                    <div className="relative mx-auto mb-6 h-16 w-16">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 opacity-20 blur-xl animate-pulse"></div>
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
                            <Stethoscope className="h-8 w-8 text-white animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-1.5 w-32 mx-auto rounded-full bg-purple-100 overflow-hidden">
                            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 animate-[loading_1s_ease-in-out_infinite]"></div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Loading Doctor Portal...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-purple-100 bg-white/80 backdrop-blur-xl lg:block">
                <div className="flex h-full flex-col">
                    {/* Logo Section */}
                    <div className="flex h-16 items-center gap-3 border-b border-purple-100 px-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-200">
                            <Stethoscope className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">Doctor Portal</p>
                            <p className="text-xs text-slate-500">Gertrude&apos;s Children Hospital</p>
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
                                        ? 'bg-gradient-to-r from-purple-500 to-violet-600 shadow-lg shadow-purple-200'
                                        : 'hover:bg-purple-50'
                                        }`}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <Icon className={`transition-all duration-200 ${isActive ? 'h-6 w-6 text-white' : 'h-5 w-5 text-slate-600 group-hover:text-purple-700 group-hover:scale-110'}`} />
                                    <span className={`flex-1 ${isActive ? 'text-white font-bold text-base' : 'text-slate-600 text-sm font-medium group-hover:text-purple-700'}`}>{item.label}</span>
                                    {item.label === 'Messages' && notifications > 0 && (
                                        <span className={`flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
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
                    <div className="border-t border-purple-100 p-4">
                        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">Dr. {user?.fullName}</p>
                                <p className="truncate text-xs text-slate-500">{user?.specialization}</p>
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-md">
                            <Stethoscope className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-800">Doctor Portal</p>
                            <p className="text-[11px] text-slate-500">GCH System</p>
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
                        <div className="sticky top-0 flex h-16 items-center justify-between border-b border-purple-100 bg-white px-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600">
                                    <Stethoscope className="h-4 w-4 text-white" />
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
                        <div className="border-b border-purple-100 p-4">
                            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">Dr. {user?.fullName}</p>
                                    <p className="text-sm text-slate-500">{user?.specialization}</p>
                                </div>
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
                                                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg'
                                                : 'text-slate-600 hover:bg-purple-50'
                                                }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="flex-1">{item.label}</span>
                                            {item.label === 'Messages' && notifications > 0 && (
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
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
                        <div className="absolute inset-x-0 bottom-0 border-t border-purple-100 bg-white p-4 pb-safe">
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
                <div className="flex items-center justify-around py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 px-3 py-1.5 ${isActive ? 'text-purple-600' : 'text-slate-400'
                                    }`}
                            >
                                <div className="relative">
                                    <Icon className={`h-6 w-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                    {item.label === 'Messages' && notifications > 0 && (
                                        <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                                            {notifications > 9 ? '9+' : notifications}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                    {item.label.split(' ')[0]}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
