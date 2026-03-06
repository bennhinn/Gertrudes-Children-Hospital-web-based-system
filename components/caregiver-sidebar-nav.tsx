'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    Users,
    Calendar,
    MessageSquare,
    Settings,
    Receipt,
    ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
    href: string
    label: string
    icon: LucideIcon
    description?: string
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: Home, description: 'Overview & quick actions' },
    { href: '/patients', label: 'Children', icon: Users, description: 'Manage profiles' },
    { href: '/caregiver-appointments', label: 'Appointments', icon: Calendar, description: 'Schedule & view' },
    { href: '/billing', label: 'Billing', icon: Receipt },
    { href: '/caregiver-messages', label: 'Messages', icon: MessageSquare, description: 'Chat with staff' },
    { href: '/caregiver-settings', label: 'Settings', icon: Settings, description: 'Preferences' },
]

export function CaregiverSidebarNav() {
    const pathname = usePathname()

    return (
        <nav className="space-y-1.5" aria-label="Main navigation">
            <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Menu
            </div>
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${isActive
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-blue-500/30'
                                : 'bg-white text-slate-700 ring-1 ring-slate-100 hover:ring-blue-200 hover:shadow-md hover:bg-blue-50/60'
                            }`}
                    >
                        <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200 ${isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-50 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div
                                className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-900'
                                    }`}
                            >
                                {item.label}
                            </div>
                            {item.description && (
                                <div
                                    className={`truncate text-xs ${isActive ? 'text-white/75' : 'text-slate-500'
                                        }`}
                                >
                                    {item.description}
                                </div>
                            )}
                        </div>
                        <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-all duration-150 ${isActive
                                    ? 'text-white/70 opacity-100'
                                    : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-blue-500 group-hover:translate-x-0.5'
                                }`}
                            aria-hidden="true"
                        />
                    </Link>
                )
            })}
        </nav>
    )
}
