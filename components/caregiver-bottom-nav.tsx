'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, MessageSquare, Settings, LucideIcon } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

// ─── Per-item color map ────────────────────────────────────────────────────────
const COLORS = [
  { grad: 'linear-gradient(135deg, #6366F1, #4F46E5)', glow: 'rgba(99,102,241,0.55)', accent: '#6366F1', soft: 'rgba(99,102,241,.12)', shimmer: '#C7D2FE' },
  { grad: 'linear-gradient(135deg, #10B981, #059669)', glow: 'rgba(16,185,129,0.55)', accent: '#10B981', soft: 'rgba(16,185,129,.12)', shimmer: '#A7F3D0' },
  { grad: 'linear-gradient(135deg, #06B6D4, #0284C7)', glow: 'rgba(6,182,212,0.55)', accent: '#06B6D4', soft: 'rgba(6,182,212,.12)', shimmer: '#A5F3FC' },
  { grad: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', glow: 'rgba(139,92,246,0.55)', accent: '#8B5CF6', soft: 'rgba(139,92,246,.12)', shimmer: '#DDD6FE' },
  { grad: 'linear-gradient(135deg, #F59E0B, #D97706)', glow: 'rgba(245,158,11,0.55)', accent: '#F59E0B', soft: 'rgba(245,158,11,.12)', shimmer: '#FDE68A' },
]

// ─── Injected CSS for animations ──────────────────────────────────────────────
const CSS = `
  @keyframes bnav-badgePulse {
    0%, 100% { transform: scale(1); }
    40%      { transform: scale(1.18); }
  }
  @keyframes bnav-rippleOut {
    0%   { transform: scale(0); opacity: 0.45; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  @keyframes bnav-dotIn {
    0%   { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
`

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem { href: string; label: string; icon: LucideIcon; badge?: number }

const navItems: NavItem[] = [
  { href: '/dashboard',              label: 'Home',     icon: Home },
  { href: '/patients',               label: 'Children', icon: Users },
  { href: '/caregiver-appointments', label: 'Appts',    icon: Calendar },
  { href: '/caregiver-messages',     label: 'Chat',     icon: MessageSquare, badge: 2 },
  { href: '/caregiver-settings',     label: 'Settings', icon: Settings },
]

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function CaregiverBottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [ripple, setRipple] = useState<{ index: number; key: number } | null>(null)
  const [itemWidths, setItemWidths] = useState<number[]>([])
  const [barRef, setBarRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const activeIndex = navItems.findIndex(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  )
  const currentIndex = activeIndex >= 0 ? activeIndex : 0
  const color = COLORS[currentIndex]

  // Measure each item width so the blob can slide accurately
  useEffect(() => {
    if (!barRef) return
    const items = barRef.querySelectorAll<HTMLElement>('[data-nav-item]')
    if (items.length) {
      setItemWidths(Array.from(items).map(el => el.offsetWidth))
    }
  }, [barRef, mounted])

  const blobLeft = itemWidths.slice(0, currentIndex).reduce((a, b) => a + b, 0)
  const blobWidth = itemWidths[currentIndex] ?? 0

  const handleTap = useCallback((index: number) => {
    setRipple({ index, key: Date.now() })
  }, [])

  if (!mounted) {
    return (
      <nav className="lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 72, zIndex: 50 }} />
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav
        className="lg:hidden"
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(255,255,255,.82)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          borderTop: '1px solid rgba(99,102,241,.06)',
          boxShadow: '0 -2px 20px rgba(30,27,75,.06), inset 0 1px 0 rgba(255,255,255,.9)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 4px)',
        }}
      >
        <div
          ref={setBarRef}
          style={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-around',
            height: 68,
            maxWidth: 480,
            margin: '0 auto',
            padding: '0 4px',
            position: 'relative',
          }}
        >
          {/* ── SLIDING BLOB (liquid indicator) ── */}
          {itemWidths.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 6,
              bottom: 6,
              left: blobLeft,
              width: blobWidth,
              borderRadius: 20,
              background: color.soft,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,.7), 0 0 12px ${color.soft}`,
              transition: `left 0.42s ${SPRING}, width 0.42s ${SPRING}, background 0.35s ease, box-shadow 0.35s ease`,
              pointerEvents: 'none',
              zIndex: 0,
            }} />
          )}

          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = currentIndex === index
            const c = COLORS[index]

            return (
              <Link
                key={item.href}
                href={item.href}
                data-nav-item
                onClick={() => handleTap(index)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  gap: 2,
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  position: 'relative',
                  zIndex: 1,
                  userSelect: 'none',
                }}
              >
                {/* Tap ripple */}
                {ripple?.index === index && (
                  <div
                    key={ripple.key}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 20,
                      overflow: 'hidden',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      aspectRatio: '1',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%,-50%)',
                      borderRadius: '50%',
                      background: c.soft,
                      animation: 'bnav-rippleOut 0.52s ease-out forwards',
                    }} />
                  </div>
                )}

                {/* Icon wrapper — bounces up when active */}
                <div style={{
                  position: 'relative',
                  width: 42,
                  height: 42,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: `transform 0.38s ${SPRING}`,
                  transform: isActive ? 'translateY(-3px) scale(1.08)' : 'translateY(0) scale(1)',
                }}>
                  {/* Glow ring (active only) */}
                  <div style={{
                    position: 'absolute',
                    width: '160%',
                    height: '160%',
                    top: '-30%',
                    left: '-30%',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
                    filter: 'blur(6px)',
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'scale(1)' : 'scale(0.6)',
                    transition: `opacity 0.3s ease, transform 0.38s ${SPRING}`,
                    pointerEvents: 'none',
                  }} />

                  {/* Icon bubble */}
                  <div style={{
                    position: 'relative',
                    zIndex: 1,
                    width: 36,
                    height: 36,
                    borderRadius: isActive ? 16 : 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isActive ? c.grad : '#F1F5F9',
                    boxShadow: isActive
                      ? `0 4px 0 rgba(0,0,0,.10), 0 8px 20px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.35)`
                      : '0 2px 0 rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.9)',
                    transition: `all 0.32s ease, transform 0.38s ${SPRING}`,
                    transform: isActive ? 'rotate(-8deg)' : 'rotate(0deg)',
                  }}>
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      color={isActive ? 'white' : '#94A3B8'}
                      style={{ transition: 'color 0.25s ease' }}
                    />

                    {/* Badge */}
                    {item.badge && item.badge > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: -3,
                        right: -4,
                        minWidth: 17,
                        height: 17,
                        borderRadius: 999,
                        background: isActive ? c.grad : 'linear-gradient(135deg, #F43F5E, #E11D48)',
                        fontSize: 9,
                        fontWeight: 900,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: "'Nunito', sans-serif",
                        border: '2px solid rgba(255,255,255,.9)',
                        boxShadow: isActive ? `0 2px 8px ${c.glow}` : '0 2px 8px rgba(244,63,94,.4)',
                        padding: '0 3px',
                        animation: 'bnav-badgePulse 2.2s ease-in-out infinite',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Label — fades in when active */}
                <span style={{
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  color: isActive ? c.accent : '#B0B7C8',
                  fontFamily: "'Nunito', sans-serif",
                  lineHeight: 1,
                  position: 'relative',
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'translateY(0)' : 'translateY(4px)',
                  maxHeight: isActive ? 20 : 0,
                  overflow: 'hidden',
                  transition: `opacity 0.26s ease, transform 0.3s ${SPRING}, color 0.26s ease, max-height 0.3s ease`,
                }}>
                  {item.label}
                </span>

                {/* Active dot */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: 4,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: c.grad,
                    boxShadow: `0 0 6px ${c.accent}`,
                    animation: 'bnav-dotIn 0.3s ease-out forwards',
                  }} />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}