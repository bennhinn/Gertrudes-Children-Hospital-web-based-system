'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, MessageSquare, Settings, LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface NavItem {
    href: string
    label: string
    icon: LucideIcon
    badge?: number
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/patients', label: 'Children', icon: Users },
    { href: '/caregiver-appointments', label: 'Appointments', icon: Calendar },
    { href: '/caregiver-messages', label: 'Messages', icon: MessageSquare, badge: 2 },
    { href: '/caregiver-settings', label: 'Settings', icon: Settings },
]

export function CaregiverBottomNav() {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)
    const [prevIndex, setPrevIndex] = useState(0)

    useEffect(() => {
        setMounted(true)
    }, [])

    const activeIndex = navItems.findIndex(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    const currentIndex = activeIndex >= 0 ? activeIndex : 0

    useEffect(() => {
        if (mounted && activeIndex >= 0) {
            setPrevIndex(activeIndex)
        }
    }, [activeIndex, mounted])

    if (!mounted) {
        return (
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-slate-900/10 lg:hidden">
                <div className="flex justify-around px-2 h-[72px]" />
            </nav>
        )
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/98 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-slate-900/10 lg:hidden">
            {/* Active indicator bar - animated */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100">
                <div
                    className="absolute top-0 h-0.5 w-[20%] bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300 ease-out"
                    style={{
                        left: `${currentIndex * 20}%`,
                        boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
                    }}
                />
            </div>

            <div className="relative flex justify-around px-1">
                {navItems.map((item, index) => {
                    const Icon = item.icon
                    const isActive = currentIndex === index

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-1 flex-col items-center pt-2 pb-2"
                        >
                            {/* Ripple effect background */}
                            <div
                                className={`absolute inset-x-2 top-1 bottom-1 rounded-2xl transition-all duration-300 ease-out ${isActive
                                        ? 'bg-blue-50 scale-100 opacity-100'
                                        : 'bg-transparent scale-90 opacity-0'
                                    }`}
                            />

                            {/* Icon container with spring animation */}
                            <div
                                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 ease-out ${isActive
                                        ? 'scale-110'
                                        : 'scale-100 active:scale-90'
                                    }`}
                                style={{
                                    transform: isActive ? 'translateY(-2px) scale(1.1)' : 'translateY(0) scale(1)',
                                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }}
                            >
                                <Icon
                                    className={`h-[22px] w-[22px] transition-all duration-300 ${isActive
                                            ? 'text-blue-600'
                                            : 'text-slate-400'
                                        }`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />

                                {/* Badge */}
                                {item.badge && item.badge > 0 && (
                                    <span
                                        className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white transition-all duration-300 ${isActive ? 'bg-blue-600 scale-110' : 'bg-red-500'
                                            }`}
                                        style={{
                                            boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.4)' : '0 2px 8px rgba(239, 68, 68, 0.4)'
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </div>

                            {/* Label with fade/slide animation */}
                            <span
                                className={`relative z-10 mt-0.5 text-[10px] font-semibold tracking-tight transition-all duration-300 ${isActive
                                        ? 'text-blue-600 opacity-100'
                                        : 'text-slate-400 opacity-80'
                                    }`}
                                style={{
                                    transform: isActive ? 'translateY(0)' : 'translateY(0)',
                                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }}
                            >
                                {item.label}
                            </span>

                            {/* Active dot indicator */}
                            <div
                                className={`absolute bottom-0.5 h-1 w-1 rounded-full bg-blue-600 transition-all duration-300 ${isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                                    }`}
                            />
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
