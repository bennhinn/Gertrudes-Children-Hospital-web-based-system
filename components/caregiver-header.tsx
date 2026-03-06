'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
    FileText,
    HelpCircle,
    LogOut,
    ChevronRight,
    Shield,
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
            { href: '/caregiver-health-records', label: 'Medical Records', icon: FileText, description: 'Health history', bg: '#ECFDF5', iconColor: '#10B981' },
        ]
    },
    {
        section: 'Navigation',
        items: [
            { href: '/dashboard', label: 'Home', icon: Home, description: 'Dashboard overview', bg: '#EEF2FF', iconColor: '#6366F1' },
            { href: '/patients', label: 'Children', icon: Users, description: 'Manage profiles', bg: '#ECFEFF', iconColor: '#06B6D4' },
            { href: '/caregiver-appointments', label: 'Appointments', icon: Calendar, description: 'Schedule visits', bg: '#FFFBEB', iconColor: '#F59E0B' },
            { href: '/caregiver-messages', label: 'Messages', icon: MessageSquare, description: 'Chat with staff', bg: '#EEF2FF', iconColor: '#6366F1' },
        ]
    },
    {
        section: 'Account',
        items: [
            { href: '/caregiver-settings', label: 'Settings', icon: Settings, description: 'Preferences', bg: '#F1F0FB', iconColor: '#6B7280' },
            { href: '/caregiver-settings', label: 'Help & Support', icon: HelpCircle, description: 'FAQs & contact', bg: '#F0FDFA', iconColor: '#14B8A6' },
        ]
    }
]

const pageInfo: Record<string, { title: string; subtitle: string }> = {
    '/dashboard': { title: 'Dashboard', subtitle: 'Overview & quick actions' },
    '/patients': { title: 'My Children', subtitle: 'Manage child profiles' },
    '/caregiver-appointments': { title: 'Appointments', subtitle: 'Schedule & manage visits' },
    '/caregiver-messages': { title: 'Messages', subtitle: 'Chat with care team' },
    '/caregiver-settings': { title: 'Settings', subtitle: 'Account & preferences' },
    '/caregiver-health-records': { title: 'Health Records', subtitle: 'Medical history' },
}

export default function CaregiverHeader({ fullName, email, initials }: CaregiverHeaderProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const pathname = usePathname()

    const currentPage = pageInfo[pathname] || { title: 'Portal', subtitle: 'Caregiver' }

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
            {/* ── HEADER BAR ── */}
            <header
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    marginBottom: 16,
                    background: 'rgba(255,255,255,.72)',
                    backdropFilter: 'blur(20px) saturate(1.4)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                    borderBottom: '1px solid rgba(99,102,241,.08)',
                    boxShadow: '0 4px 24px rgba(99,102,241,.06)',
                }}
            >
                <div style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>

                        {/* ── Left: Avatar + Page context ── */}
                        <div className="flex items-center gap-3 lg:hidden" style={{ minWidth: 0 }}>
                            <div style={{
                                width: 38,
                                height: 38,
                                borderRadius: 14,
                                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 13,
                                fontWeight: 800,
                                color: 'white',
                                flexShrink: 0,
                                boxShadow: '0 3px 0 rgba(99,102,241,.3), 0 5px 12px rgba(99,102,241,.18), inset 0 1px 0 rgba(255,255,255,.35)',
                                fontFamily: "'Nunito', sans-serif",
                            }}>
                                {initials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <p style={{
                                    fontSize: 15,
                                    fontWeight: 800,
                                    color: 'var(--clay-text-dark)',
                                    fontFamily: "'Fraunces', serif",
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    lineHeight: 1.2,
                                }}>
                                    {currentPage.title}
                                </p>
                                <p style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: 'var(--clay-text-muted)',
                                    fontFamily: "'Nunito', sans-serif",
                                    lineHeight: 1.3,
                                }}>
                                    {currentPage.subtitle}
                                </p>
                            </div>
                        </div>

                        {/* ── Left (desktop): Hospital branding ── */}
                        <div className="hidden lg:flex items-center gap-3">
                            <div style={{
                                width: 38,
                                height: 38,
                                borderRadius: 14,
                                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 3px 0 rgba(99,102,241,.3), 0 5px 12px rgba(99,102,241,.18), inset 0 1px 0 rgba(255,255,255,.35)',
                            }}>
                                <span style={{ fontSize: 16, fontWeight: 800, color: 'white', fontFamily: "'Fraunces', serif" }}>G</span>
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: 15,
                                    fontWeight: 800,
                                    color: 'var(--clay-text-dark)',
                                    fontFamily: "'Fraunces', serif",
                                    lineHeight: 1.2,
                                    margin: 0,
                                }}>
                                    Gertrude&apos;s Children Hospital
                                </h1>
                                <p style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: 'var(--clay-text-muted)',
                                    fontFamily: "'Nunito', sans-serif",
                                    lineHeight: 1.3,
                                    margin: 0,
                                }}>
                                    Caregiver Portal
                                </p>
                            </div>
                        </div>

                        {/* ── Right: Action buttons ── */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* Hamburger (mobile) */}
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                aria-label="Open menu"
                                className="lg:hidden"
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: 14,
                                    background: 'rgba(99,102,241,.06)',
                                    border: '1.5px solid rgba(99,102,241,.1)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    color: 'var(--clay-text-mid)',
                                }}
                            >
                                <Menu size={18} />
                            </button>

                            {/* Bell */}
                            <button
                                aria-label="Notifications"
                                style={{
                                    position: 'relative',
                                    width: 38,
                                    height: 38,
                                    borderRadius: 14,
                                    background: 'rgba(99,102,241,.06)',
                                    border: '1.5px solid rgba(99,102,241,.1)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    color: 'var(--clay-text-mid)',
                                }}
                            >
                                <Bell size={18} />
                                <span style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -4,
                                    width: 18,
                                    height: 18,
                                    borderRadius: 9999,
                                    background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontFamily: "'Nunito', sans-serif",
                                    boxShadow: '0 2px 6px rgba(239,68,68,.45)',
                                    border: '2px solid white',
                                }}>
                                    3
                                </span>
                            </button>

                            {/* Book CTA (tablet+) */}
                            <Link href="/caregiver-appointments" className="hidden sm:block" style={{ textDecoration: 'none' }}>
                                <button className="clay-cta" style={{
                                    height: 38,
                                    padding: '0 14px',
                                    fontSize: 12,
                                    gap: 5,
                                    boxShadow: '0 3px 0 rgba(99,102,241,.3), 0 5px 12px rgba(99,102,241,.18), inset 0 1px 0 rgba(255,255,255,.25)',
                                }}>
                                    <Plus size={14} />
                                    <span style={{ fontWeight: 800, fontFamily: "'Nunito', sans-serif" }}>Book</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── MOBILE SLIDE-OVER MENU ── */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 50,
                            background: 'rgba(30,27,75,.45)',
                            backdropFilter: 'blur(6px)',
                        }}
                        onClick={() => setIsMenuOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 50,
                            width: '100%',
                            maxWidth: 360,
                            background: 'linear-gradient(180deg, #FAFAFF 0%, var(--clay-bg) 100%)',
                            boxShadow: '-8px 0 40px rgba(30,27,75,.12)',
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile menu"
                    >
                        <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
                            {/* ── Menu Header: Profile card ── */}
                            <div style={{
                                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 60%, #7C3AED 100%)',
                                padding: '24px 20px 20px',
                                position: 'relative',
                                overflow: 'hidden',
                            }}>
                                {/* Decorative blob */}
                                <div style={{
                                    position: 'absolute',
                                    top: -30,
                                    right: -30,
                                    width: 120,
                                    height: 120,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,.08)',
                                    pointerEvents: 'none',
                                }} />

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 16,
                                            background: 'rgba(255,255,255,.2)',
                                            backdropFilter: 'blur(8px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 16,
                                            fontWeight: 800,
                                            color: 'white',
                                            fontFamily: "'Nunito', sans-serif",
                                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 4px 12px rgba(0,0,0,.15)',
                                            flexShrink: 0,
                                        }}>
                                            {initials}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{
                                                fontSize: 15,
                                                fontWeight: 800,
                                                color: 'white',
                                                fontFamily: "'Nunito', sans-serif",
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                lineHeight: 1.3,
                                            }}>
                                                {fullName}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <Shield size={11} style={{ color: '#34D399' }} />
                                                <span style={{
                                                    fontSize: 11,
                                                    color: '#A7F3D0',
                                                    fontWeight: 700,
                                                    fontFamily: "'Nunito', sans-serif",
                                                }}>
                                                    Verified Caregiver
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsMenuOpen(false)}
                                        aria-label="Close menu"
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 12,
                                            background: 'rgba(255,255,255,.15)',
                                            border: 'none',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            color: 'white',
                                        }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* ── Menu Content ── */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                                {menuItems.map((section, sectionIdx) => (
                                    <div key={section.section} style={{ marginTop: sectionIdx > 0 ? 20 : 0 }}>
                                        <p style={{
                                            fontSize: 10,
                                            fontWeight: 800,
                                            textTransform: 'uppercase',
                                            letterSpacing: '1.2px',
                                            color: 'var(--clay-text-muted)',
                                            padding: '0 12px',
                                            marginBottom: 6,
                                            fontFamily: "'Nunito', sans-serif",
                                        }}>
                                            {section.section}
                                        </p>
                                        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                            {section.items.map((item) => {
                                                const Icon = item.icon
                                                const isActive = pathname === item.href
                                                return (
                                                    <Link
                                                        key={item.href + item.label}
                                                        href={item.href}
                                                        onClick={handleLinkClick}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 12,
                                                            padding: '10px 12px',
                                                            textDecoration: 'none',
                                                            borderRadius: 14,
                                                            background: isActive
                                                                ? 'linear-gradient(135deg, #6366F1, #4F46E5)'
                                                                : 'transparent',
                                                            boxShadow: isActive
                                                                ? '0 3px 0 rgba(99,102,241,.3), 0 5px 12px rgba(99,102,241,.15), inset 0 1px 0 rgba(255,255,255,.2)'
                                                                : 'none',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: 12,
                                                            background: isActive ? 'rgba(255,255,255,.2)' : item.bg,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                            boxShadow: isActive ? 'none' : '0 2px 0 rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.6)',
                                                        }}>
                                                            <Icon size={18} style={{ color: isActive ? 'white' : item.iconColor }} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{
                                                                fontSize: 14,
                                                                fontWeight: 700,
                                                                color: isActive ? 'white' : 'var(--clay-text-dark)',
                                                                fontFamily: "'Nunito', sans-serif",
                                                            }}>
                                                                {item.label}
                                                            </p>
                                                            <p style={{
                                                                fontSize: 11,
                                                                color: isActive ? 'rgba(255,255,255,.7)' : 'var(--clay-text-muted)',
                                                                fontFamily: "'Nunito', sans-serif",
                                                            }}>
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                        <ChevronRight size={14} style={{
                                                            color: isActive ? 'rgba(255,255,255,.5)' : 'var(--clay-text-muted)',
                                                            flexShrink: 0,
                                                            opacity: 0.5,
                                                        }} />
                                                    </Link>
                                                )
                                            })}
                                        </nav>
                                    </div>
                                ))}
                            </div>

                            {/* ── Menu Footer ── */}
                            <div style={{ borderTop: '1px solid rgba(99,102,241,.06)', padding: '12px 16px 16px' }}>
                                <form action="/api/auth/logout" method="POST">
                                    <button
                                        type="submit"
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            padding: '12px 16px',
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: 'var(--clay-text-mid)',
                                            background: 'rgba(99,102,241,.04)',
                                            border: '1.5px solid rgba(99,102,241,.08)',
                                            borderRadius: 14,
                                            cursor: 'pointer',
                                            fontFamily: "'Nunito', sans-serif",
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <LogOut size={16} />
                                        Sign Out
                                    </button>
                                </form>
                                <p style={{
                                    marginTop: 10,
                                    textAlign: 'center',
                                    fontSize: 10,
                                    color: 'var(--clay-text-muted)',
                                    fontFamily: "'Nunito', sans-serif",
                                    opacity: 0.7,
                                }}>
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
