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
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }} aria-label="Main navigation">
            <div className="clay-label" style={{ padding: '0 12px', marginBottom: 4, color: 'var(--clay-text-muted)' }}>
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
                        className={isActive ? 'clay-nav-active' : 'clay-nav-item'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            textDecoration: 'none',
                        }}
                    >
                        <div
                            className="clay-ico"
                            style={{
                                width: 36,
                                height: 36,
                                background: isActive
                                    ? 'rgba(255,255,255,.2)'
                                    : 'linear-gradient(135deg, #EEF2FF, #C7D2FE)',
                                boxShadow: isActive
                                    ? 'none'
                                    : '0 2px 0 rgba(99,102,241,.12), inset 0 1px 0 rgba(255,255,255,.5)',
                            }}
                        >
                            <Icon size={18} style={{ color: isActive ? 'white' : '#6366F1' }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                                style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: isActive ? 'white' : 'var(--clay-text-dark)',
                                    fontFamily: "'Nunito', sans-serif",
                                }}
                            >
                                {item.label}
                            </div>
                            {item.description && (
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: isActive ? 'rgba(255,255,255,.7)' : 'var(--clay-text-muted)',
                                        fontFamily: "'Nunito', sans-serif",
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {item.description}
                                </div>
                            )}
                        </div>
                        <ChevronRight
                            size={16}
                            style={{
                                flexShrink: 0,
                                color: isActive ? 'rgba(255,255,255,.6)' : 'var(--clay-text-muted)',
                                opacity: isActive ? 1 : 0.4,
                            }}
                            aria-hidden="true"
                        />
                    </Link>
                )
            })}
        </nav>
    )
}
