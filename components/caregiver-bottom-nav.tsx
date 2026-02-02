'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, MessageSquare, Settings, LucideIcon } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

interface NavItem {
    href: string
    label: string
    icon: LucideIcon
    badge?: number
    animation: 'bounce' | 'pulse' | 'spin' | 'wiggle' | 'breathe'
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: Home, animation: 'bounce' },
    { href: '/patients', label: 'Children', icon: Users, animation: 'pulse' },
    { href: '/caregiver-appointments', label: 'Appts', icon: Calendar, animation: 'spin' },
    { href: '/caregiver-messages', label: 'Messages', icon: MessageSquare, badge: 2, animation: 'wiggle' },
    { href: '/caregiver-settings', label: 'Settings', icon: Settings, animation: 'breathe' },
]

// CSS keyframe animations
const styles = `
@keyframes nav-bounce {
    0%, 100% { transform: translateY(0) scale(1.1); }
    50% { transform: translateY(-4px) scale(1.15); }
}
@keyframes nav-pulse {
    0%, 100% { transform: scale(1.1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.8; }
}
@keyframes nav-spin {
    0% { transform: scale(1.1) rotate(0deg); }
    100% { transform: scale(1.1) rotate(360deg); }
}
@keyframes nav-wiggle {
    0%, 100% { transform: rotate(0deg) scale(1.1); }
    25% { transform: rotate(-8deg) scale(1.1); }
    75% { transform: rotate(8deg) scale(1.1); }
}
@keyframes nav-breathe {
    0%, 100% { transform: scale(1.1); }
    50% { transform: scale(1.2); }
}
@keyframes blob-morph {
    0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
    50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}
@keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}
`

export function CaregiverBottomNav() {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)
    const [tappedIndex, setTappedIndex] = useState<number | null>(null)
    const navRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const activeIndex = navItems.findIndex(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    const currentIndex = activeIndex >= 0 ? activeIndex : 0

    const handleTap = (index: number) => {
        setTappedIndex(index)
        setTimeout(() => setTappedIndex(null), 600)
    }

    const getAnimationStyle = (animation: string, isActive: boolean): React.CSSProperties => {
        if (!isActive) return {}

        const animations: Record<string, string> = {
            bounce: 'nav-bounce 0.6s ease-in-out infinite',
            pulse: 'nav-pulse 1.2s ease-in-out infinite',
            spin: 'nav-spin 0.6s ease-out',
            wiggle: 'nav-wiggle 0.5s ease-in-out infinite',
            breathe: 'nav-breathe 2s ease-in-out infinite',
        }

        return { animation: animations[animation] || '' }
    }

    if (!mounted) {
        return (
            <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
                <div className="h-[72px] bg-white/80 backdrop-blur-xl" />
            </nav>
        )
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <nav
                ref={navRef}
                className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 bg-white/70 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom)] lg:hidden"
            >
                {/* Glassmorphism gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-white/20 to-transparent pointer-events-none" />

                {/* Animated liquid blob indicator */}
                <div
                    className="absolute top-2 h-14 w-[18%] transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]"
                    style={{
                        left: `${currentIndex * 20 + 1}%`,
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.15))',
                        animation: 'blob-morph 3s ease-in-out infinite',
                    }}
                />

                {/* Top indicator line with glow */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100/50">
                    <div
                        className="absolute top-0 h-1 w-[20%] rounded-full transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]"
                        style={{
                            left: `${currentIndex * 20}%`,
                            background: 'linear-gradient(90deg, #3b82f6, #06b6d4, #3b82f6)',
                            boxShadow: '0 0 12px rgba(59, 130, 246, 0.6), 0 0 24px rgba(6, 182, 212, 0.4)',
                        }}
                    />
                </div>

                <div className="relative flex justify-around px-2 py-2">
                    {navItems.map((item, index) => {
                        const Icon = item.icon
                        const isActive = currentIndex === index
                        const isTapped = tappedIndex === index

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => handleTap(index)}
                                className="relative flex flex-1 flex-col items-center py-1.5 group"
                            >
                                {/* Touch ripple effect */}
                                {isTapped && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div
                                            className="w-12 h-12 rounded-full bg-blue-400/30 animate-ping"
                                            style={{ animationDuration: '0.6s' }}
                                        />
                                    </div>
                                )}

                                {/* Active background with shimmer */}
                                <div
                                    className={`absolute inset-x-2 top-0 bottom-0 rounded-2xl overflow-hidden transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50" />
                                    {isActive && (
                                        <div
                                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                                            style={{ animation: 'shimmer 2s ease-in-out infinite' }}
                                        />
                                    )}
                                </div>

                                {/* Icon container with micro-animation */}
                                <div
                                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${isActive ? '' : 'group-hover:scale-105 group-active:scale-95'
                                        }`}
                                    style={getAnimationStyle(item.animation, isActive)}
                                >
                                    <Icon
                                        className={`h-[22px] w-[22px] transition-all duration-300 ${isActive
                                                ? 'text-blue-600 drop-shadow-[0_2px_8px_rgba(59,130,246,0.4)]'
                                                : 'text-slate-400 group-hover:text-slate-600'
                                            }`}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />

                                    {/* Animated badge */}
                                    {item.badge && item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-[9px] font-bold text-white shadow-lg shadow-red-500/30 animate-pulse">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Label with fade effect */}
                                <span
                                    className={`relative z-10 mt-0.5 text-[10px] font-semibold tracking-wide transition-all duration-300 ${isActive
                                            ? 'text-blue-600 translate-y-0 opacity-100'
                                            : 'text-slate-400 group-hover:text-slate-600'
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </>
    )
}
