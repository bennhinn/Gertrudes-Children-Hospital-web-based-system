'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useSWR from 'swr';
import Link from 'next/link';
import {
    Users, Baby, Stethoscope, Calendar, Clock,
    CalendarCheck, UserCog, FileBarChart, ArrowRight,
    TrendingUp, Activity
} from 'lucide-react';

// ─── Clay Design System ───────────────────────────────────────────────────────
const clayCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');

  :root {
    --bg: #EEF2FF;
    --surface: #FFFFFF;
    --indigo: #6366F1; --indigo-l: #C7D2FE; --indigo-s: #EEF2FF;
    --purple: #8B5CF6; --purple-l: #DDD6FE; --purple-s: #EDE9FE;
    --emerald: #10B981; --emerald-l: #A7F3D0; --emerald-s: #ECFDF5;
    --amber: #F59E0B; --amber-l: #FDE68A; --amber-s: #FFFBEB;
    --orange: #F97316; --orange-l: #FED7AA; --orange-s: #FFF7ED;
    --cyan: #06B6D4; --cyan-l: #A5F3FC; --cyan-s: #ECFEFF;
    --rose: #F43F5E;  --rose-s: #FFF1F2;
    --text-dark: #1E1B4B; --text-mid: #4C4C72; --text-muted: #9090B0;

    --clay-sm:  0 4px 0 rgba(0,0,0,.12), 0 6px 16px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.7);
    --clay-md:  0 6px 0 rgba(0,0,0,.13), 0 10px 24px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.65);
    --clay-lg:  0 8px 0 rgba(0,0,0,.14), 0 16px 40px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.6);
    --clay-pressed: 0 2px 0 rgba(0,0,0,.12), inset 0 2px 4px rgba(0,0,0,.08);
    --spring: cubic-bezier(0.34,1.56,0.64,1);
    --ease: cubic-bezier(0.16,1,0.3,1);
  }

  .clay-page * { font-family: 'Nunito', sans-serif !important; box-sizing: border-box; }

  /* noise grain */
  .clay-page::before {
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    opacity:.35;
  }

  /* ── STAT CARD ── */
  .clay-stat {
    border-radius: 24px !important; border: none !important;
    box-shadow: var(--clay-md) !important;
    transition: transform .22s var(--spring), box-shadow .22s ease;
    overflow: hidden; position: relative; cursor: default;
  }
  .clay-stat:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 14px 0 rgba(0,0,0,.13), 0 24px 52px rgba(0,0,0,.13), inset 0 1px 0 rgba(255,255,255,.65) !important;
  }
  .clay-stat:active { transform: translateY(3px); box-shadow: var(--clay-pressed) !important; }
  .stat-blob { position:absolute; border-radius:50%; pointer-events:none; background:rgba(255,255,255,.15); }

  /* ── ICON BUBBLE ── */
  .clay-ico {
    border-radius: 16px;
    box-shadow: 0 4px 0 rgba(0,0,0,.15), 0 8px 16px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.5);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    transition: transform .22s var(--spring);
  }
  .clay-stat:hover .clay-ico { transform: rotate(-10deg) scale(1.15); }

  /* ── SURFACE PANEL ── */
  .clay-panel {
    border-radius: 24px !important; border: none !important;
    box-shadow: var(--clay-md) !important; background: white; overflow: hidden;
  }

  /* ── ACTIVITY ROW ── */
  .clay-activity-row {
    border-radius: 16px;
    background: linear-gradient(135deg, #FAFBFF, #F0F4FF);
    box-shadow: 0 2px 0 rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.9);
    transition: transform .18s var(--spring), box-shadow .18s ease;
    cursor: pointer;
  }
  .clay-activity-row:hover {
    transform: translateX(5px) scale(1.01);
    box-shadow: 0 4px 0 rgba(0,0,0,.07), 0 8px 20px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.9);
  }

  /* ── ACTIVITY AVATAR ── */
  .clay-act-avatar {
    border-radius: 50%;
    box-shadow: 0 3px 0 rgba(99,102,241,.25), 0 5px 12px rgba(99,102,241,.15), inset 0 1px 0 rgba(255,255,255,.4);
    transition: transform .22s var(--spring);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .clay-activity-row:hover .clay-act-avatar { transform: scale(1.12) rotate(-5deg); }

  /* ── STATUS BADGE ── */
  .clay-badge {
    border-radius: 999px;
    box-shadow: 0 2px 0 rgba(0,0,0,.07), inset 0 1px 0 rgba(255,255,255,.6);
    font-weight: 800; font-size: 11px; padding: 4px 11px;
    display:inline-flex; align-items:center; gap:4px;
  }

  /* ── QUICK ACTION LINK ── */
  .clay-qa {
    border-radius: 20px;
    background: white;
    box-shadow: 0 3px 0 rgba(0,0,0,.07), 0 6px 18px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9);
    display:flex; align-items:center; gap:14px; padding:16px 18px;
    transition: transform .2s var(--spring), box-shadow .2s ease;
    text-decoration: none !important;
    position: relative; overflow: hidden;
  }
  .clay-qa::after {
    content:'';
    position:absolute; right:-20px; top:50%; transform:translateY(-50%);
    width:60px; height:60px; border-radius:50%;
    background:rgba(255,255,255,0); transition:background .25s ease;
  }
  .clay-qa:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 7px 0 rgba(0,0,0,.09), 0 14px 32px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.9);
  }
  .clay-qa:active { transform: translateY(2px); box-shadow: var(--clay-pressed); }
  .clay-qa:hover .qa-arrow { transform: translateX(5px); }
  .qa-arrow { transition: transform .2s var(--spring); }
  .clay-qa:hover .clay-ico { transform: rotate(-8deg) scale(1.12); }

  /* ── SHIMMER SKELETON ── */
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .shimmer {
    background: linear-gradient(90deg, #EEF2FF 25%, #E0E7FF 50%, #EEF2FF 75%);
    background-size:400px 100%; animation:shimmer 1.4s ease-in-out infinite;
    border-radius:16px;
  }

  /* ── DECORATIVE BLOBS ── */
  @keyframes blobFloat { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.07) rotate(5deg)} }
  .deco-blob { position:fixed; border-radius:50%; pointer-events:none; animation:blobFloat 7s ease-in-out infinite; z-index:0; }

  /* ── LIVE PULSE ── */
  @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.35)} }
  .live-dot { animation:livePulse 1.5s ease-in-out infinite; }

  /* ── TREND CHIP ── */
  .clay-trend {
    display:inline-flex; align-items:center; gap:4px;
    border-radius:999px; padding:3px 9px;
    font-size:11px; font-weight:800;
    box-shadow:0 2px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.7);
  }

  /* ── SECTION TITLE ── */
  .section-title { font-family:'Fraunces',serif !important; font-weight:700; color:var(--text-dark); }

  /* ── ERROR STATE ── */
  .clay-error {
    border-radius:24px; padding:40px;
    background:linear-gradient(135deg,#FFF1F2,#FFE4E6);
    box-shadow:var(--clay-md); text-align:center;
  }
  .clay-error-btn {
    margin-top:16px; border-radius:999px; border:none; cursor:pointer;
    padding:10px 24px; font-weight:800; font-family:'Nunito',sans-serif;
    background:linear-gradient(135deg,#F43F5E,#E11D48); color:white;
    box-shadow:0 4px 0 rgba(244,63,94,.3),0 6px 16px rgba(244,63,94,.2);
    transition:transform .2s var(--spring);
  }
  .clay-error-btn:hover { transform:translateY(-2px); }
`;

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

// ─── Status config ────────────────────────────────────────────────────────────
const statusMap: Record<string, { bg: string; color: string }> = {
    pending:   { bg: '#FEF9C3', color: '#A16207' },
    confirmed: { bg: '#DBEAFE', color: '#1D4ED8' },
    completed: { bg: '#DCFCE7', color: '#15803D' },
    cancelled: { bg: '#FFE4E6', color: '#BE123C' },
};
const getStatus = (s: string) => statusMap[s] || { bg: '#F1F5F9', color: '#475569' };

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const { data: stats, error: statsError, isLoading: statsLoading } = useSWR('/api/admin/stats', fetcher);
    const { data: activity, error: activityError, isLoading: activityLoading } = useSWR('/api/admin/recent-activity', fetcher);

    // ── Error state ──
    if (statsError || activityError) return (
        <>
            <style dangerouslySetInnerHTML={{ __html: clayCSS }} />
            <div className="clay-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 420, background: 'var(--bg)' }}>
                <div className="clay-error">
                    <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg,#F43F5E,#E11D48)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 5px 0 rgba(244,63,94,.3),0 8px 20px rgba(244,63,94,.2)' }}>
                        <Activity size={26} color="white" />
                    </div>
                    <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Error loading dashboard</p>
                    <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 6 }}>Please try refreshing the page</p>
                    <button className="clay-error-btn" onClick={() => window.location.reload()}>Retry</button>
                </div>
            </div>
        </>
    );

    // ── Loading skeleton ──
    if (statsLoading || activityLoading) return (
        <>
            <style dangerouslySetInnerHTML={{ __html: clayCSS }} />
            <div className="clay-page" style={{ background: 'var(--bg)', minHeight: '100vh', padding: '32px 16px 48px' }}>
                <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div className="shimmer" style={{ height: 36, width: 220 }} />
                            <div className="shimmer" style={{ height: 18, width: 160 }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
                            {[...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 110 }} />)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 16 }}>
                            <div className="shimmer" style={{ height: 360 }} />
                            <div className="shimmer" style={{ height: 360 }} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    // ── Stat card config ──
    const statCards = [
        {
            label: 'Total Users', value: stats?.totalUsers ?? 0,
            gradient: 'linear-gradient(135deg,#EEF2FF,#C7D2FE)',
            iconGrad: 'linear-gradient(135deg,#6366F1,#4F46E5)',
            tc: '#4F46E5', Icon: Users,
            trend: 'Active accounts', trendBg: '#EEF2FF', trendColor: '#4F46E5',
        },
        {
            label: 'Registered Children', value: stats?.totalChildren ?? 0,
            gradient: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)',
            iconGrad: 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
            tc: '#6D28D9', Icon: Baby,
            trend: 'Patient records', trendBg: '#EDE9FE', trendColor: '#6D28D9',
        },
        {
            label: 'Total Doctors', value: stats?.totalDoctors ?? 0,
            gradient: 'linear-gradient(135deg,#ECFDF5,#A7F3D0)',
            iconGrad: 'linear-gradient(135deg,#10B981,#059669)',
            tc: '#15803D', Icon: Stethoscope,
            trend: 'Medical staff', trendBg: '#ECFDF5', trendColor: '#15803D',
        },
        {
            label: 'Total Appointments', value: stats?.totalAppointments ?? 0,
            gradient: 'linear-gradient(135deg,#FFF7ED,#FED7AA)',
            iconGrad: 'linear-gradient(135deg,#F97316,#EA580C)',
            tc: '#C2410C', Icon: Calendar,
            trend: 'All time', trendBg: '#FFF7ED', trendColor: '#C2410C',
        },
        {
            label: 'Pending Appointments', value: stats?.pendingAppointments ?? 0,
            gradient: 'linear-gradient(135deg,#FFFBEB,#FDE68A)',
            iconGrad: 'linear-gradient(135deg,#F59E0B,#D97706)',
            tc: '#B45309', Icon: Clock,
            trend: 'Awaiting action', trendBg: '#FFFBEB', trendColor: '#B45309',
        },
        {
            label: "Today's Appointments", value: stats?.todayAppointments ?? 0,
            gradient: 'linear-gradient(135deg,#ECFEFF,#A5F3FC)',
            iconGrad: 'linear-gradient(135deg,#06B6D4,#0284C7)',
            tc: '#0E7490', Icon: CalendarCheck,
            trend: 'Scheduled today', trendBg: '#ECFEFF', trendColor: '#0E7490',
        },
    ];

    // ── Quick actions config ──
    const quickActions = [
        { href: '/admin/users',        label: 'Manage Users',       desc: 'View and edit user accounts',       Icon: Users,        iconGrad: 'linear-gradient(135deg,#6366F1,#4F46E5)', arrowColor: '#6366F1', hoverBorder: '#C7D2FE' },
        { href: '/admin/staff',        label: 'Manage Staff',       desc: 'Doctors, nurses, and other staff',  Icon: UserCog,      iconGrad: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', arrowColor: '#8B5CF6', hoverBorder: '#DDD6FE' },
        { href: '/admin/appointments', label: 'View Appointments',  desc: 'All system appointments',           Icon: CalendarCheck, iconGrad: 'linear-gradient(135deg,#10B981,#059669)', arrowColor: '#10B981', hoverBorder: '#A7F3D0' },
        { href: '/admin/reports',      label: 'View Reports',       desc: 'Analytics and insights',            Icon: FileBarChart, iconGrad: 'linear-gradient(135deg,#F97316,#EA580C)', arrowColor: '#F97316', hoverBorder: '#FED7AA' },
    ];

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: clayCSS }} />

            <div className="clay-page" style={{ background: 'var(--bg)', minHeight: '100vh', padding: '0 0 56px', position: 'relative' }}>

                {/* Decorative blobs */}
                <div className="deco-blob" style={{ width: 420, height: 420, background: 'radial-gradient(circle,rgba(99,102,241,.07),transparent 70%)', top: -100, right: -100 }} />
                <div className="deco-blob" style={{ width: 300, height: 300, background: 'radial-gradient(circle,rgba(16,185,129,.06),transparent 70%)', bottom: 160, left: -70, animationDelay: '3.5s' }} />
                <div className="deco-blob" style={{ width: 200, height: 200, background: 'radial-gradient(circle,rgba(139,92,246,.05),transparent 70%)', top: '40%', left: '45%', animationDelay: '6s' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>

                    {/* ── PAGE HEADER ─────────────────────────────────────── */}
                    <div style={{ padding: '32px 0 28px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            {/* Top badge row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <div className="clay-ico" style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white' }}>
                                    <Activity size={20} />
                                </div>
                                <span style={{
                                    background: '#EEF2FF', color: '#4F46E5',
                                    borderRadius: 999, padding: '4px 13px', fontSize: 12, fontWeight: 800,
                                    boxShadow: '0 3px 0 rgba(0,0,0,.07), inset 0 1px 0 rgba(255,255,255,.8)',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}>
                                    <span className="live-dot" style={{ width: 7, height: 7, background: '#10B981', borderRadius: '50%', display: 'inline-block' }} />
                                    Live Dashboard
                                </span>
                            </div>
                            <h1 className="section-title" style={{ fontSize: 34, lineHeight: 1, marginBottom: 4 }}>Admin Dashboard</h1>
                            <p style={{ fontSize: 14, color: '#9090B0', fontWeight: 600 }}>System overview and management</p>
                        </div>

                        {/* Last updated */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'white', borderRadius: 999, padding: '8px 16px',
                            boxShadow: '0 3px 0 rgba(0,0,0,.07), 0 5px 14px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9)',
                        }}>
                            <span className="live-dot" style={{ width: 7, height: 7, background: '#10B981', borderRadius: '50%', display: 'inline-block' }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#4C4C72' }}>Updated just now</span>
                        </div>
                    </div>

                    {/* ── STAT CARDS ──────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(195px,1fr))', gap: 13, marginBottom: 28 }}>
                        {statCards.map((s, i) => (
                            <div key={i} className="clay-stat" style={{ background: s.gradient, padding: '20px 22px' }}>
                                {/* Corner blob */}
                                <div className="stat-blob" style={{ width: 100, height: 100, bottom: -28, right: -28 }} />

                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                    <div>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: s.tc, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{s.label}</p>
                                        <p className="section-title" style={{ fontSize: 42, lineHeight: 1, marginBottom: 8 }}>
                                            {s.value.toLocaleString()}
                                        </p>
                                        <span className="clay-trend" style={{ background: s.trendBg, color: s.trendColor }}>
                                            <TrendingUp size={10} /> {s.trend}
                                        </span>
                                    </div>
                                    <div className="clay-ico" style={{ width: 48, height: 48, background: s.iconGrad, color: 'white', marginTop: 2 }}>
                                        <s.Icon size={22} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── BOTTOM ROW ───────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 18 }}>

                        {/* Recent Appointments */}
                        <div className="clay-panel">
                            {/* Panel header */}
                            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="clay-ico" style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: 'white' }}>
                                        <Calendar size={16} />
                                    </div>
                                    <p className="section-title" style={{ fontSize: 18 }}>Recent Appointments</p>
                                </div>
                                <Link href="/admin/appointments" style={{
                                    textDecoration: 'none',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                    background: '#EEF2FF', color: '#4F46E5',
                                    borderRadius: 999, padding: '5px 13px', fontSize: 12, fontWeight: 800,
                                    boxShadow: '0 2px 0 rgba(0,0,0,.07), inset 0 1px 0 rgba(255,255,255,.8)',
                                    transition: 'transform .2s var(--spring)',
                                }}>
                                    View all <ArrowRight size={12} />
                                </Link>
                            </div>

                            <div style={{ padding: '16px 18px' }}>
                                {!activity || activity.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <div style={{
                                            width: 60, height: 60, borderRadius: 20,
                                            background: 'linear-gradient(135deg,#EEF2FF,#C7D2FE)',
                                            boxShadow: 'var(--clay-sm)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 14px',
                                        }}>
                                            <Calendar size={26} style={{ color: '#6366F1' }} />
                                        </div>
                                        <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 15 }}>No recent appointments</p>
                                        <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 5 }}>Appointments will appear here</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                                        {activity.map((apt: any) => {
                                            const st = getStatus(apt.status);
                                            const initials = (apt.child?.full_name || 'U')[0].toUpperCase();
                                            return (
                                                <div key={apt.id} className="clay-activity-row"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', gap: 12 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                                        <div className="clay-act-avatar"
                                                            style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#EEF2FF,#C7D2FE)', color: '#4F46E5' }}>
                                                            <span style={{ fontFamily: 'Fraunces,serif', fontSize: 17, fontWeight: 700 }}>{initials}</span>
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14 }}>{apt.child?.full_name || 'Unknown'}</p>
                                                            <p style={{ fontSize: 11, color: '#9090B0', fontWeight: 600, marginTop: 1 }}>
                                                                {apt.scheduled_for
                                                                    ? new Date(apt.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                                    : 'No date'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="clay-badge" style={{ background: st.bg, color: st.color }}>
                                                        {apt.status || 'unknown'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="clay-panel">
                            {/* Panel header */}
                            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid #EEF2FF', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="clay-ico" style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', color: 'white' }}>
                                    <Activity size={16} />
                                </div>
                                <p className="section-title" style={{ fontSize: 18 }}>Quick Actions</p>
                            </div>

                            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {quickActions.map((qa, i) => (
                                    <Link key={i} href={qa.href} className="clay-qa" style={{ border: `1.5px solid ${qa.hoverBorder}30` }}>
                                        {/* Faint pastel blob behind icon */}
                                        <div style={{
                                            position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
                                            width: 70, height: 70, borderRadius: '50%',
                                            background: `${qa.hoverBorder}22`, pointerEvents: 'none',
                                        }} />
                                        <div className="clay-ico" style={{ width: 44, height: 44, background: qa.iconGrad, color: 'white', position: 'relative', zIndex: 1 }}>
                                            <qa.Icon size={20} />
                                        </div>
                                        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                                            <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14 }}>{qa.label}</p>
                                            <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 2 }}>{qa.desc}</p>
                                        </div>
                                        <ArrowRight size={16} className="qa-arrow" style={{ color: qa.arrowColor, opacity: 0.7, flexShrink: 0, position: 'relative', zIndex: 1 }} />
                                    </Link>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}