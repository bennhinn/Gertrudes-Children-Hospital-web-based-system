'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Menu,
    X,
    Bell,
    Plus,
    Home,
    Users,
    Calendar,
    MessageSquare,
    Settings,
    TestTube,
    Pill,
    FileText,
    Heart,
    HelpCircle,
    LogOut,
    ChevronRight,
    Shield,
    Activity
} from 'lucide-react'

interface CaregiverHeaderProps {
    fullName: string
    email: string
    initials: string
}

const menuItems = [
    {
        section: 'Health Records',
        items: [
            { href: '/caregiver-lab-results', label: 'Lab Results', icon: TestTube, description: 'View test results', color: 'bg-purple-50 text-purple-600' },
            { href: '/caregiver-prescriptions', label: 'Prescriptions', icon: Pill, description: 'Medications & refills', color: 'bg-pink-50 text-pink-600' },
            { href: '/caregiver-health-records', label: 'Medical Records', icon: FileText, description: 'Health history', color: 'bg-emerald-50 text-emerald-600' },
            { href: '/caregiver-vaccinations', label: 'Vaccinations', icon: Heart, description: 'Immunization records', color: 'bg-red-50 text-red-600' },
        ]
    },
    {
        section: 'Navigation',
        items: [
            { href: '/dashboard', label: 'Home', icon: Home, description: 'Dashboard overview', color: 'bg-blue-50 text-blue-600' },
            { href: '/patients', label: 'Children', icon: Users, description: 'Manage profiles', color: 'bg-cyan-50 text-cyan-600' },
            { href: '/caregiver-appointments', label: 'Appointments', icon: Calendar, description: 'Schedule visits', color: 'bg-amber-50 text-amber-600' },
            { href: '/caregiver-messages', label: 'Messages', icon: MessageSquare, description: 'Chat with staff', color: 'bg-indigo-50 text-indigo-600' },
        ]
    },
    {
        section: 'Account',
        items: [
            { href: '/caregiver-settings', label: 'Settings', icon: Settings, description: 'Preferences', color: 'bg-slate-100 text-slate-600' },
            { href: '/caregiver-settings', label: 'Help & Support', icon: HelpCircle, description: 'FAQs & contact', color: 'bg-teal-50 text-teal-600' },
        ]
    }
]

export default function CaregiverHeader({ fullName, email, initials }: CaregiverHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    // Handle escape key and body scroll lock
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden'

            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === 'Escape') setIsMenuOpen(false)
            }

            document.addEventListener('keydown', handleEscape)
            return () => {
                document.body.style.overflow = ''
                document.removeEventListener('keydown', handleEscape)
            }
        } else {
            document.body.style.overflow = ''
        }
    }, [isMenuOpen])

    const handleLinkClick = () => setIsMenuOpen(false)

    return (
        <>
            <header className="sticky top-0 z-40 mb-4 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 lg:mb-6 lg:rounded-2xl lg:border lg:shadow-sm">
                <div className="px-4 py-3 lg:px-6 lg:py-4">
                    <div className="flex items-center justify-between gap-3 lg:gap-4">
                        {/* Mobile: User avatar */}
                        <div className="flex items-center gap-3 lg:hidden">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-md shadow-blue-500/25">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">{fullName}</p>
                                <p className="text-xs text-slate-500">Welcome back!</p>
                            </div>
                        </div>

                        {/* Desktop: Page title area */}
                        <div className="hidden lg:flex lg:items-center lg:gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
                                <Activity className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">Gertrude&apos;s Children Hospital</h1>
                                <p className="text-xs text-slate-500">Caregiver Portal</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Mobile Hamburger Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                aria-label="Open menu"
                                className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            {/* Notification Bell */}
                            <Button variant="ghost" size="sm" className="relative h-10 w-10 p-0 rounded-xl hover:bg-slate-100">
                                <Bell className="h-5 w-5 text-slate-600" />
                                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">3</span>
                            </Button>

                            {/* Primary CTA - Book Appointment */}
                            <Link href="/caregiver-appointments" className="hidden sm:block">
                                <Button size="sm" className="h-10 px-4 rounded-xl shadow-sm bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    <span className="font-semibold">Book</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay & Panel */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMenuOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Menu Panel */}
                    <div
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile menu"
                    >
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-blue-500/25">
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{fullName}</p>
                                        <div className="flex items-center gap-1">
                                            <Shield className="h-3 w-3 text-emerald-600" />
                                            <span className="text-xs text-emerald-600 font-medium">Verified</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    aria-label="Close menu"
                                    className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto px-4 py-4">
                                {menuItems.map((section, sectionIdx) => (
                                    <div key={section.section} className={sectionIdx > 0 ? 'mt-6' : ''}>
                                        <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                            {section.section}
                                        </p>
                                        <nav className="space-y-1">
                                            {section.items.map((item) => {
                                                const Icon = item.icon
                                                return (
                                                    <Link
                                                        key={item.href + item.label}
                                                        href={item.href}
                                                        onClick={handleLinkClick}
                                                        className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 group"
                                                    >
                                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                                                            <Icon className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-900">{item.label}</p>
                                                            <p className="text-xs text-slate-500">{item.description}</p>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                                                    </Link>
                                                )
                                            })}
                                        </nav>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-slate-100 p-4">
                                <form action="/api/auth/logout" method="POST">
                                    <button
                                        type="submit"
                                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </form>
                                <p className="mt-3 text-center text-xs text-slate-400">
                                    Gertrude&apos;s Children Hospital v2.0
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
