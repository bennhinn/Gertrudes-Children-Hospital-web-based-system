'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Pill,
    CheckCircle,
    Package,
    MessageSquare,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronRight,
    Activity,
    User,
    Sparkles
} from 'lucide-react'

const navItems = [
    { href: '/pharmacy', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/pharmacy/prescriptions', icon: Pill, label: 'Prescriptions' },
    { href: '/pharmacy/dispensed', icon: CheckCircle, label: 'Dispensed' },
    { href: '/pharmacy/inventory', icon: Package, label: 'Inventory' },
    { href: '/pharmacy/messages', icon: MessageSquare, label: 'Messages' },
]

export default function PharmacyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [user, setUser] = useState<{
        fullName: string
        email: string
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [notifications] = useState(5)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        async function checkAuth() {
            try {
                const supabase = createClient()
                const { data: { user: authUser } } = await supabase.auth.getUser()

                if (!authUser) {
                    router.push('/login')
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role')
                    .eq('id', authUser.id)
                    .single()

                if (profile?.role !== 'pharmacist' && profile?.role !== 'admin') {
                    router.push('/login')
                    return
                }

                setUser({
                    fullName: profile?.full_name || 'Pharmacist',
                    email: authUser.email || '',
                })
            } catch (error) {
                console.error('Auth error:', error)
                router.push('/login')
            } finally {
                setLoading(false)
            }
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
            <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50">
                <div className="text-center">
                    <div className="relative mx-auto mb-4 h-14 w-14">
                        <div className="absolute inset-0 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600"></div>
                        <div className="absolute inset-2 rounded-full bg-white"></div>
                        <Pill className="absolute inset-0 m-auto h-6 w-6 text-teal-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Loading Pharmacy Portal...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-teal-100 bg-white/80 backdrop-blur-xl lg:block">
                <div className="flex h-full flex-col">
                    {/* Logo Section */}
                    <div className="flex h-16 items-center gap-3 border-b border-teal-100 px-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-200">
                            <Pill className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">Pharmacy</p>
                            <p className="text-xs text-slate-500">GCH System</p>
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
                                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-200'
                                        : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                                        }`}
                                >
                                    <Icon className={`h-5 w-5 transition-transform duration-200 ${!isActive && 'group-hover:scale-110'}`} />
                                    <span className="flex-1">{item.label}</span>
                                    {item.label === 'Prescriptions' && notifications > 0 && (
                                        <span className={`flex h-5 min-w-5 items-center justify-center rounded-full text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {notifications}
                                        </span>
                                    )}
                                    {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="border-t border-teal-100 p-4">
                        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">{user?.fullName}</p>
                                <p className="truncate text-xs text-slate-500">Pharmacist</p>
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
            <header className="fixed inset-x-0 top-0 z-50 border-b border-teal-200 bg-white shadow-sm lg:hidden">
                <div className="flex h-14 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md">
                            <Pill className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-slate-800">Pharmacy</p>
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
                        <div className="sticky top-0 flex h-16 items-center justify-between border-b border-teal-100 bg-white px-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600">
                                    <Pill className="h-4 w-4 text-white" />
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
                        <div className="border-b border-teal-100 p-4">
                            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{user?.fullName}</p>
                                    <p className="text-sm text-slate-500">Pharmacist</p>
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
                                                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                                                : 'text-slate-600 hover:bg-teal-50'
                                                }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="flex-1">{item.label}</span>
                                            {item.label === 'Prescriptions' && notifications > 0 && (
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'
                                                    }`}>
                                                    {notifications}
                                                </span>
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </nav>

                        {/* Quick Actions */}
                        <div className="border-t border-teal-100 p-4">
                            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Actions</p>
                            <button className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:from-amber-100 hover:to-orange-100">
                                <Sparkles className="h-5 w-5" />
                                Low Stock Alerts
                                <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">3</span>
                            </button>
                        </div>

                        {/* Logout */}
                        <div className="absolute inset-x-0 bottom-0 border-t border-teal-100 bg-white p-4 pb-safe">
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
            <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-sm lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                <div className="grid grid-cols-5 py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        // Shorter labels for mobile
                        const shortLabel = item.label === 'Prescriptions' ? 'Rx'
                            : item.label === 'Dashboard' ? 'Home'
                                : item.label === 'Messages' ? 'Chat'
                                    : item.label
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 py-1 ${isActive ? 'text-teal-600' : 'text-slate-400'}`}
                            >
                                <div className="relative">
                                    <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                    {item.label === 'Prescriptions' && notifications > 0 && (
                                        <span className="absolute -right-1.5 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                                            {notifications > 9 ? '9+' : notifications}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                    {shortLabel}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
