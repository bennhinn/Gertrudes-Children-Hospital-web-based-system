'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const navItems = [
    { href: '/pharmacy', icon: '🏠', label: 'Dashboard' },
    { href: '/pharmacy/prescriptions', icon: '💊', label: 'Prescriptions' },
    { href: '/pharmacy/dispensed', icon: '✅', label: 'Dispensed' },
    { href: '/pharmacy/inventory', icon: '📦', label: 'Inventory' },
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
    const [sidebarOpen, setSidebarOpen] = useState(false)
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

                // Get profile info
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, role')
                    .eq('id', authUser.id)
                    .single()

                // Check if user has pharmacy/pharmacist role
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

    if (loading) {
        return (
            <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-cyan-50 to-teal-50">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
                    <span className="text-lg font-medium text-cyan-700">Loading...</span>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-[100dvh] bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-cyan-200 bg-white/80 backdrop-blur-sm lg:block">
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center gap-3 border-b border-cyan-100 px-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-xl">
                            💊
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">Pharmacy</p>
                            <p className="text-xs text-slate-500">GCH System</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 p-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${isActive
                                        ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg'
                                        : 'text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Info */}
                    <div className="border-t border-cyan-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white">
                                {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-slate-700">{user.fullName}</p>
                                <p className="truncate text-xs text-slate-500">Pharmacist</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="fixed inset-x-0 top-0 z-30 border-b border-cyan-200 bg-white/90 backdrop-blur-md lg:hidden">
                <div className="flex h-14 items-center justify-between px-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xl sm:text-2xl">💊</span>
                        <span className="font-bold text-slate-800 text-sm sm:text-base">Pharmacy</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="rounded-lg p-2 hover:bg-cyan-50 text-xl"
                    >
                        ☰
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className="absolute inset-y-0 left-0 w-64 bg-white p-4">
                        <nav className="space-y-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${pathname === item.href
                                        ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white'
                                        : 'text-slate-600 hover:bg-cyan-50'
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-cyan-200 bg-white/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden">
                <div className="flex items-center justify-around py-1.5 sm:py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px] ${isActive ? 'text-cyan-600' : 'text-slate-500'
                                    }`}
                            >
                                <span className="text-xl">{item.icon}</span>
                                <span className="text-[10px] sm:text-xs font-medium">{item.label.split(' ')[0]}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-14 pb-20 lg:pl-64 lg:pt-0 lg:pb-0">
                <div className="p-4 lg:p-8">{children}</div>
            </main>
        </div>
    )
}
