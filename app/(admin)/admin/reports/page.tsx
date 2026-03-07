'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Users, Calendar, Stethoscope, DollarSign, PieChart as PieChartIcon,
    Monitor, Download, Eye, RefreshCw, FileText, Activity, BarChart3,
    Baby, TrendingUp, Star, LucideIcon, Plus, Pencil, Trash2, Key,
    LogOut, AlertTriangle, CheckCircle2
} from 'lucide-react';

// ─── clay / skeuomorphic design tokens ───────────────────────────────────────
const clayVars = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&display=swap');

  :root {
    --bg: #EEF2FF;
    --bg2: #E0E7FF;
    --surface: #FFFFFF;
    --clay-blue: #6366F1;
    --clay-blue-l: #C7D2FE;
    --clay-green: #10B981;
    --clay-green-l: #A7F3D0;
    --clay-amber: #F59E0B;
    --clay-amber-l: #FDE68A;
    --clay-rose: #F43F5E;
    --clay-rose-l: #FECDD3;
    --clay-purple: #8B5CF6;
    --clay-purple-l: #DDD6FE;
    --clay-cyan: #06B6D4;
    --clay-cyan-l: #A5F3FC;
    --clay-orange: #EA580C;
    --clay-orange-l: #FED7AA;
    --text-dark: #1E1B4B;
    --text-mid: #4C4C72;
    --text-light: #9090B0;

    /* Clay shadow recipe: bottom hard shadow + soft diffuse shadow */
    --clay-sm: 0 4px 0 rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7);
    --clay-md: 0 6px 0 rgba(0,0,0,0.13), 0 10px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.65);
    --clay-lg: 0 8px 0 rgba(0,0,0,0.14), 0 16px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
    --clay-pressed: 0 2px 0 rgba(0,0,0,0.12), 0 3px 8px rgba(0,0,0,0.08), inset 0 2px 4px rgba(0,0,0,0.08);
    --radius-clay: 24px;
    --radius-pill: 999px;
    --font-body: 'Nunito', sans-serif;
    --font-display: 'Fraunces', serif;
  }

  * { font-family: var(--font-body) !important; box-sizing: border-box; }

  /* Noise texture overlay */
  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    opacity: 0.4;
  }

  /* Clay stat card */
  .clay-stat {
    border-radius: var(--radius-clay);
    box-shadow: var(--clay-md);
    border: none !important;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease;
  }
  .clay-stat:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 12px 0 rgba(0,0,0,0.13), 0 20px 48px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.65);
  }
  .clay-stat:active {
    transform: translateY(3px);
    box-shadow: var(--clay-pressed);
  }

  /* Clay report card */
  .clay-report-card {
    border-radius: var(--radius-clay);
    box-shadow: var(--clay-lg);
    border: none !important;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
    overflow: hidden;
  }
  .clay-report-card:hover {
    transform: translateY(-6px) rotate(-0.5deg);
    box-shadow: 0 14px 0 rgba(0,0,0,0.14), 0 28px 56px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.6);
  }

  /* Clay chart card */
  .clay-chart {
    border-radius: var(--radius-clay);
    box-shadow: var(--clay-md);
    border: none !important;
    background: var(--surface);
    overflow: hidden;
  }

  /* Clay icon bubble */
  .clay-icon {
    border-radius: 18px;
    box-shadow: 0 4px 0 rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
    flex-shrink: 0;
  }
  .clay-stat:hover .clay-icon { transform: rotate(-8deg) scale(1.12); }

  /* Clay button primary */
  .clay-btn-primary {
    border-radius: var(--radius-pill);
    box-shadow: 0 5px 0 rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3);
    border: none !important;
    font-weight: 700 !important;
    font-family: var(--font-body) !important;
    letter-spacing: 0.01em;
    transition: transform 0.14s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.14s ease;
  }
  .clay-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 7px 0 rgba(0,0,0,0.2), 0 12px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3);
  }
  .clay-btn-primary:active {
    transform: translateY(3px);
    box-shadow: 0 2px 0 rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.12), inset 0 2px 4px rgba(0,0,0,0.1);
  }

  /* Clay button secondary */
  .clay-btn-sec {
    border-radius: var(--radius-pill) !important;
    box-shadow: 0 3px 0 rgba(0,0,0,0.1), 0 5px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.8) !important;
    font-weight: 700 !important;
    transition: transform 0.14s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.14s ease;
  }
  .clay-btn-sec:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 0 rgba(0,0,0,0.1), 0 8px 20px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8) !important;
  }
  .clay-btn-sec:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.08) !important;
  }

  /* Clay pill badge */
  .clay-badge {
    border-radius: var(--radius-pill);
    box-shadow: 0 2px 0 rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6);
    font-weight: 700;
    font-size: 11px;
    padding: 3px 10px;
    display: inline-flex; align-items: center; gap: 4px;
  }

  /* Clay tab */
  .clay-tab-active {
    border-radius: var(--radius-pill);
    background: white;
    box-shadow: var(--clay-sm);
    color: var(--clay-blue) !important;
    font-weight: 800 !important;
  }

  /* Activity log item */
  .clay-log-item {
    border-radius: 16px;
    background: linear-gradient(135deg, #f8f9ff, #f0f4ff);
    box-shadow: 0 2px 0 rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .clay-log-item:hover {
    transform: translateX(4px);
    box-shadow: 0 3px 0 rgba(0,0,0,0.07), 0 6px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9);
  }

  /* Table row hover */
  .clay-table-row:hover { background: #f0f4ff; }

  /* Select field clay */
  .clay-select {
    border-radius: var(--radius-pill) !important;
    box-shadow: 0 3px 0 rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 2px 6px rgba(0,0,0,0.04) !important;
    border: 1.5px solid #C7D2FE !important;
    font-weight: 600 !important;
    background: white !important;
    padding: 8px 16px !important;
    cursor: pointer;
    transition: box-shadow 0.15s ease;
  }
  .clay-select:focus {
    outline: none;
    border-color: var(--clay-blue) !important;
    box-shadow: 0 3px 0 rgba(99,102,241,0.2), 0 0 0 3px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.9) !important;
  }

  /* Progress bar clay */
  .clay-progress-track {
    border-radius: 999px;
    background: #E0E7FF;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  .clay-progress-fill {
    border-radius: 999px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4);
    transition: width 0.6s cubic-bezier(0.34,1.56,0.64,1);
  }

  /* Insight card */
  .clay-insight {
    border-radius: 20px;
    box-shadow: var(--clay-sm);
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1);
  }
  .clay-insight:hover { transform: scale(1.02) translateY(-2px); }

  /* Decorative blob */
  .deco-blob {
    position: absolute; border-radius: 50%;
    pointer-events: none; z-index: 0;
    animation: blobPulse 6s ease-in-out infinite;
  }
  @keyframes blobPulse {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.08) rotate(5deg); }
  }

  /* Skeuomorphic inset panel */
  .skeu-panel {
    border-radius: 16px;
    background: linear-gradient(145deg, #e8ecff, #f4f6ff);
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.08), inset 0 -1px 0 rgba(255,255,255,0.7);
    border: 1px solid rgba(255,255,255,0.6);
  }

  /* Report type card icon strip */
  .report-icon-strip {
    border-radius: 18px 18px 0 0;
    padding: 20px 20px 14px;
    position: relative; overflow: hidden;
  }

  /* Live dot */
  @keyframes livePulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.4); }
  }
  .live-dot { animation: livePulse 1.5s ease-in-out infinite; }

  /* Shimmer loading */
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .shimmer {
    background: linear-gradient(90deg, #f0f4ff 25%, #e0e8ff 50%, #f0f4ff 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 12px;
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface ReportViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportType: string;
    reportTitle: string;
    period: string;
}

interface ActivityLog {
    id: string;
    user_email: string;
    user_role: string;
    action: string;
    action_type: string;
    resource_type: string;
    target_table: string;
    description: string;
    created_at: string;
}

// ─── Clay Status Badge ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { bg: string; color: string }> = {
        create: { bg: '#DCFCE7', color: '#15803D' },
        update: { bg: '#DBEAFE', color: '#1D4ED8' },
        delete: { bg: '#FFE4E6', color: '#BE123C' },
        login: { bg: '#EDE9FE', color: '#6D28D9' },
        logout: { bg: '#FFEDD5', color: '#C2410C' },
        view: { bg: '#CFFAFE', color: '#0E7490' },
        download: { bg: '#FEF9C3', color: '#A16207' },
        completed: { bg: '#DCFCE7', color: '#15803D' },
        cancelled: { bg: '#FFE4E6', color: '#BE123C' },
        pending: { bg: '#FEF9C3', color: '#A16207' },
        confirmed: { bg: '#DBEAFE', color: '#1D4ED8' },
    };
    const s = map[status] || { bg: '#F1F5F9', color: '#475569' };
    return (
        <span className="clay-badge" style={{ background: s.bg, color: s.color }}>
            {status}
        </span>
    );
}

// ─── Report View Modal ────────────────────────────────────────────────────────
function ReportViewModal({ isOpen, onClose, reportType, reportTitle, period }: ReportViewModalProps) {
    const { data, error, isLoading } = useSWR(
        isOpen ? `/api/admin/reports/${reportType}?period=${period}&format=json` : null,
        fetcher
    );

    const handleDownload = async () => {
        try {
            const response = await fetch(`/api/admin/reports/${reportType}?period=${period}&format=csv`);
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch (err) { alert('Failed to download report'); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto"
                style={{ borderRadius: '28px', boxShadow: '0 24px 0 rgba(0,0,0,0.12), 0 40px 80px rgba(0,0,0,0.18)', border: '2px solid rgba(255,255,255,0.8)', background: '#fafbff', fontFamily: 'Nunito, sans-serif' }}>
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span style={{ fontFamily: 'Fraunces, serif', fontSize: 22, color: '#1E1B4B', fontWeight: 700 }}>{reportTitle}</span>
                        <button onClick={handleDownload} className="clay-btn-primary"
                            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', padding: '8px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', borderRadius: 999, fontWeight: 700 }}>
                            <Download size={14} /> Download CSV
                        </button>
                    </DialogTitle>
                </DialogHeader>

                {isLoading && (
                    <div className="flex flex-col gap-3 py-8">
                        {[1, 2, 3].map(i => <div key={i} className="shimmer h-12 w-full" />)}
                    </div>
                )}
                {error && <div className="text-center py-12" style={{ color: '#F43F5E' }}>Failed to load report data</div>}

                {data && (
                    <div className="space-y-6">
                        <div className="skeu-panel p-4">
                            <p style={{ fontSize: 13, color: '#4C4C72', fontWeight: 600 }}>
                                📅 Period: {new Date(data.period?.start).toLocaleDateString()} – {new Date(data.period?.end).toLocaleDateString()}
                            </p>
                        </div>

                        {reportType === 'user_activity' && (
                            <div className="space-y-4">
                                <div className="clay-stat p-5" style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: '#4F46E5', fontWeight: 700 }}>Total Activities</span>
                                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: 32, color: '#1E1B4B', fontWeight: 700, lineHeight: 1 }}>{data.totalActivities}</span>
                                </div>
                                <ModalTable headers={['Time', 'User', 'Action', 'Description']}>
                                    {data.activities?.slice(0, 50).map((a: any, i: number) => (
                                        <tr key={i} className="clay-table-row transition-colors">
                                            <td className="px-4 py-3 text-sm" style={{ color: '#4C4C72' }}>{new Date(a.created_at).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{a.user_email || 'System'}</td>
                                            <td className="px-4 py-3"><StatusBadge status={a.action_type} /></td>
                                            <td className="px-4 py-3 text-sm" style={{ color: '#4C4C72' }}>{a.description}</td>
                                        </tr>
                                    ))}
                                </ModalTable>
                            </div>
                        )}

                        {reportType === 'appointments' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Total', val: data.stats?.total, bg: '#EEF2FF', c: '#4F46E5' },
                                        { label: 'Completed', val: data.stats?.completed, bg: '#DCFCE7', c: '#15803D' },
                                        { label: 'Pending', val: data.stats?.pending, bg: '#FEF9C3', c: '#A16207' },
                                        { label: 'Cancelled', val: data.stats?.cancelled, bg: '#FFE4E6', c: '#BE123C' },
                                    ].map(s => (
                                        <div key={s.label} className="clay-stat p-4 text-center" style={{ background: s.bg }}>
                                            <p style={{ fontSize: 11, fontWeight: 800, color: s.c, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</p>
                                            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, marginTop: 4 }}>{s.val}</p>
                                        </div>
                                    ))}
                                </div>
                                <ModalTable headers={['Date', 'Time', 'Patient', 'Doctor', 'Status']}>
                                    {data.appointments?.slice(0, 50).map((a: any, i: number) => (
                                        <tr key={i} className="clay-table-row transition-colors">
                                            <td className="px-4 py-3 text-sm" style={{ color: '#4C4C72' }}>{a.date}</td>
                                            <td className="px-4 py-3 text-sm" style={{ color: '#4C4C72' }}>{a.time}</td>
                                            <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{a.patient}</td>
                                            <td className="px-4 py-3 text-sm" style={{ color: '#4C4C72' }}>{a.doctor}</td>
                                            <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                                        </tr>
                                    ))}
                                </ModalTable>
                            </div>
                        )}

                        {reportType === 'staff_performance' && (
                            <ModalTable headers={['Doctor', 'Specialty', 'Total', 'Completed', 'Completion Rate']}>
                                {data.staffPerformance?.map((d: any, i: number) => (
                                    <tr key={i} className="clay-table-row transition-colors">
                                        <td className="px-4 py-3 font-bold" style={{ color: '#1E1B4B' }}>{d.name}</td>
                                        <td className="px-4 py-3 text-sm" style={{ color: '#4C4C72' }}>{d.specialty}</td>
                                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#1E1B4B' }}>{d.totalAppointments}</td>
                                        <td className="px-4 py-3 text-sm" style={{ color: '#4C4C72' }}>{d.completed}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="clay-progress-track" style={{ width: 80, height: 8 }}>
                                                    <div className="clay-progress-fill" style={{ width: `${d.completionRate}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #059669)' }} />
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 800, color: '#15803D' }}>{d.completionRate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </ModalTable>
                        )}

                        {reportType === 'financial' && (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="clay-stat p-6" style={{ background: 'linear-gradient(135deg, #DCFCE7, #A7F3D0)' }}>
                                        <p style={{ fontSize: 12, fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: 1 }}>Estimated Revenue</p>
                                        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, color: '#064E3B', marginTop: 4 }}>KSh {data.summary?.estimatedRevenue?.toLocaleString()}</p>
                                    </div>
                                    <div className="clay-stat p-6" style={{ background: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)' }}>
                                        <p style={{ fontSize: 12, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1 }}>Completed Appointments</p>
                                        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, color: '#1E1B4B', marginTop: 4 }}>{data.summary?.completedAppointments}</p>
                                    </div>
                                </div>
                                <div className="skeu-panel p-4 flex items-center gap-3">
                                    <AlertTriangle size={16} style={{ color: '#D97706', flexShrink: 0 }} />
                                    <p style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>{data.note}</p>
                                </div>
                            </div>
                        )}

                        {reportType === 'demographics' && (
                            <div className="space-y-4">
                                <div className="clay-stat p-5" style={{ background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, color: '#6D28D9', fontWeight: 700 }}>Total Patients</span>
                                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: 32, color: '#1E1B4B', fontWeight: 700, lineHeight: 1 }}>{data.totalPatients}</span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {[
                                        { title: 'By Age Group', entries: data.byAgeGroup, accent: '#6366F1' },
                                        { title: 'By Gender', entries: data.byGender, accent: '#8B5CF6' },
                                    ].map(({ title, entries, accent }) => (
                                        <div key={title}>
                                            <p style={{ fontWeight: 800, color: '#1E1B4B', marginBottom: 10, fontSize: 14 }}>{title}</p>
                                            <div className="space-y-2">
                                                {entries && Object.entries(entries).map(([k, v]: [string, any]) => (
                                                    <div key={k} className="clay-log-item flex items-center justify-between p-3">
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#4C4C72', textTransform: 'capitalize' }}>{k}</span>
                                                        <span className="clay-badge" style={{ background: '#EEF2FF', color: accent }}>{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {reportType === 'system_health' && (
                            <div className="space-y-4">
                                <div className="clay-stat p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #DCFCE7, #A7F3D0)' }}>
                                    <CheckCircle2 size={24} style={{ color: '#15803D' }} />
                                    <span style={{ fontSize: 16, fontWeight: 800, color: '#064E3B' }}>System Status: Healthy</span>
                                </div>
                                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                                    {[
                                        { label: 'Total Users', val: data.systemStats?.totalUsers, bg: '#EEF2FF', c: '#4F46E5' },
                                        { label: 'Total Patients', val: data.systemStats?.totalPatients, bg: '#EDE9FE', c: '#6D28D9' },
                                        { label: 'Appointments', val: data.systemStats?.totalAppointments, bg: '#DCFCE7', c: '#15803D' },
                                        { label: 'Recent Activities', val: data.systemStats?.recentActivities, bg: '#FFEDD5', c: '#C2410C' },
                                    ].map(s => (
                                        <div key={s.label} className="clay-stat p-4 text-center" style={{ background: s.bg }}>
                                            <p style={{ fontSize: 10, fontWeight: 800, color: s.c, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</p>
                                            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, marginTop: 4 }}>{s.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// Mini helper: modal table
function ModalTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
    return (
        <div className="overflow-x-auto" style={{ borderRadius: 16, boxShadow: '0 2px 0 rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr style={{ background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)' }}>
                        {headers.map(h => (
                            <th key={h} className="px-4 py-3 text-left" style={{ color: '#4F46E5', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody style={{ background: 'white' }}>{children}</tbody>
            </table>
        </div>
    );
}

// ─── Activity Logs Section ────────────────────────────────────────────────────
function ActivityLogsSection() {
    const { data, error, isLoading, mutate } = useSWR(`/api/admin/activity-logs?limit=100`, fetcher, {
        refreshInterval: 30000,
    });

    const iconMap: Record<string, React.ReactNode> = {
        create: <Plus size={14} />, update: <Pencil size={14} />, delete: <Trash2 size={14} />,
        login: <Key size={14} />, logout: <LogOut size={14} />, view: <Eye size={14} />,
        download: <Download size={14} />,
    };
    const colorMap: Record<string, { bg: string; color: string }> = {
        create: { bg: '#DCFCE7', color: '#15803D' }, update: { bg: '#DBEAFE', color: '#1D4ED8' },
        delete: { bg: '#FFE4E6', color: '#BE123C' }, login: { bg: '#EDE9FE', color: '#6D28D9' },
        logout: { bg: '#FFEDD5', color: '#C2410C' }, view: { bg: '#CFFAFE', color: '#0E7490' },
        download: { bg: '#FEF9C3', color: '#A16207' },
    };

    if (isLoading) return (
        <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="shimmer h-16 w-full" />)}
        </div>
    );

    if (error) return (
        <div className="text-center py-8" style={{ color: '#9090B0' }}>
            <p style={{ fontWeight: 600 }}>Unable to load activity logs</p>
            <button className="clay-btn-sec mt-3 px-4 py-2 text-sm" style={{ background: 'white', color: '#6366F1', cursor: 'pointer' }} onClick={() => mutate()}>
                <RefreshCw size={12} style={{ display: 'inline', marginRight: 4 }} /> Retry
            </button>
        </div>
    );

    return (
        <div className="space-y-2">
            {!data?.logs?.length ? (
                <div className="text-center py-12" style={{ color: '#9090B0', fontWeight: 600 }}>
                    No activity logs yet. Activities will appear here as they occur.
                </div>
            ) : data.logs.map((log: ActivityLog) => {
                const cs = colorMap[log.action_type] || { bg: '#F1F5F9', color: '#475569' };
                return (
                    <div key={log.id} className="clay-log-item flex items-start gap-3 p-3">
                        <div className="clay-icon" style={{ width: 32, height: 32, background: cs.bg, color: cs.color, flexShrink: 0, marginTop: 2 }}>
                            {iconMap[log.action_type] || <FileText size={14} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="clay-badge" style={{ background: cs.bg, color: cs.color }}>{log.action_type}</span>
                                <span className="clay-badge" style={{ background: '#EEF2FF', color: '#6366F1' }}>{log.resource_type || log.target_table || 'system'}</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#1E1B4B', marginTop: 4, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description}</p>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 11, color: '#9090B0', fontWeight: 600 }}>
                                <span>{log.user_email || 'System'}</span>
                                <span>·</span>
                                <span>{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [viewingReport, setViewingReport] = useState<{ type: string; title: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'reports' | 'activity'>('reports');

    const { data: stats, error: statsError, isLoading: statsLoading } = useSWR(`/api/admin/stats?period=${selectedPeriod}`, fetcher);
    const { data: appointmentData, error: appointmentError } = useSWR(`/api/admin/analytics/appointments?period=${selectedPeriod}`, fetcher);
    const { data: revenueData, error: revenueError } = useSWR(`/api/admin/analytics/revenue?period=${selectedPeriod}`, fetcher);
    const { data: demographicsData, error: demographicsError } = useSWR(`/api/admin/analytics/demographics?period=${selectedPeriod}`, fetcher);
    const { data: generatedReports } = useSWR('/api/admin/reports?limit=10', fetcher);

    const appointmentRateLabel =
        selectedPeriod === 'year'
            ? 'vs previous 365 days'
            : selectedPeriod === 'month'
                ? 'vs previous 30 days'
                : 'vs previous 7 days';

    const periodTitle = selectedPeriod === 'year' ? 'This Year' : selectedPeriod === 'month' ? 'This Month' : 'This Week';
    const appointmentSubtitle = selectedPeriod === 'year' ? 'Monthly trend (last 12 months)' : selectedPeriod === 'month' ? 'Daily trend (last 30 days)' : 'Daily trend (last 7 days)';
    const revenueSubtitle = selectedPeriod === 'year' ? 'Paid revenue (last 12 months)' : selectedPeriod === 'month' ? 'Paid revenue (last 30 days)' : 'Paid revenue (last 7 days)';
    const demographicsSubtitle = `Patient distribution (${periodTitle.toLowerCase()})`;

    const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'];

    const reportTypes: { title: string; description: string; icon: LucideIcon; gradient: string; shadow: string; type: string; emoji: string }[] = [
        { title: 'User Activity', description: 'Registrations & user behaviour', icon: Users, gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)', shadow: 'rgba(99,102,241,0.4)', type: 'user_activity', emoji: '👥' },
        { title: 'Appointments', description: 'Statistics & scheduling trends', icon: Calendar, gradient: 'linear-gradient(135deg, #10B981, #059669)', shadow: 'rgba(16,185,129,0.4)', type: 'appointments', emoji: '📅' },
        { title: 'Staff Performance', description: 'Doctor productivity metrics', icon: Stethoscope, gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', shadow: 'rgba(139,92,246,0.4)', type: 'staff_performance', emoji: '🩺' },
        { title: 'Financial Summary', description: 'Revenue & billing overview', icon: DollarSign, gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', shadow: 'rgba(245,158,11,0.4)', type: 'financial', emoji: '💰' },
        { title: 'Demographics', description: 'Age, gender & location data', icon: PieChartIcon, gradient: 'linear-gradient(135deg, #06B6D4, #0284C7)', shadow: 'rgba(6,182,212,0.4)', type: 'demographics', emoji: '🌍' },
        { title: 'System Health', description: 'Usage & performance metrics', icon: Monitor, gradient: 'linear-gradient(135deg, #F43F5E, #E11D48)', shadow: 'rgba(244,63,94,0.4)', type: 'system_health', emoji: '⚡' },
    ];

    const handleDownloadReport = async (type: string) => {
        try {
            const response = await fetch(`/api/admin/reports/${type}?period=${selectedPeriod}&format=csv`);
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a); a.click();
            window.URL.revokeObjectURL(url); document.body.removeChild(a);
        } catch (err) { alert('Failed to download report'); }
    };

    const handleExportAll = async () => {
        for (const report of reportTypes) {
            await handleDownloadReport(report.type);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    };

    if (statsError) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <div className="clay-stat p-8 text-center" style={{ background: '#FFF1F2' }}>
                <p style={{ color: '#F43F5E', fontSize: 18, fontWeight: 800 }}>Error loading reports</p>
                <p style={{ color: '#9090B0', marginTop: 8 }}>Please try refreshing the page</p>
            </div>
        </div>
    );

    // Stat cards config
    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, gradient: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)', iconBg: 'linear-gradient(135deg, #6366F1, #4F46E5)', iconColor: 'white', textColor: '#4F46E5' },
        { label: 'Appointments', value: stats?.totalAppointments || 0, icon: Calendar, gradient: 'linear-gradient(135deg, #DCFCE7, #A7F3D0)', iconBg: 'linear-gradient(135deg, #10B981, #059669)', iconColor: 'white', textColor: '#15803D' },
        { label: 'Children', value: stats?.totalChildren || 0, icon: Baby, gradient: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)', iconBg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', iconColor: 'white', textColor: '#6D28D9' },
        { label: 'Doctors', value: stats?.totalDoctors || 0, icon: Stethoscope, gradient: 'linear-gradient(135deg, #FFEDD5, #FED7AA)', iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)', iconColor: 'white', textColor: '#B45309' },
    ];

    return (
        <>
            {/* Inject clay CSS */}
            <style dangerouslySetInnerHTML={{ __html: clayVars }} />

            <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '0 0 40px', fontFamily: 'var(--font-body)', position: 'relative' }}>

                {/* Decorative background blobs */}
                <div className="deco-blob" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', top: -100, right: -100 }} />
                <div className="deco-blob" style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.07), transparent 70%)', bottom: 200, left: -80, animationDelay: '3s' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '0 20px' }}>

                    {/* ── PAGE HEADER ─────────────────────────────────────── */}
                    <div style={{ padding: '32px 0 28px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <div className="clay-icon" style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white' }}>
                                    <BarChart3 size={22} />
                                </div>
                                <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 700, color: '#1E1B4B', lineHeight: 1 }}>
                                    Reports & Analytics
                                </h1>
                            </div>
                            <p style={{ color: '#9090B0', fontSize: 14, fontWeight: 600, marginLeft: 54 }}>
                                Real-time insights across your hospital operations
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                                value={selectedPeriod}
                                onChange={e => setSelectedPeriod(e.target.value)}
                                className="clay-select"
                                style={{ fontSize: 13 }}
                            >
                                <option value="week">📅 This Week</option>
                                <option value="month">📆 This Month</option>
                                <option value="year">🗓️ This Year</option>
                            </select>
                            <button onClick={handleExportAll} className="clay-btn-primary"
                                style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', padding: '10px 22px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 999, fontWeight: 800 }}>
                                <Download size={15} /> Export All
                            </button>
                        </div>
                    </div>

                    {/* ── TABS ────────────────────────────────────────────── */}
                    <div style={{ display: 'flex', gap: 6, background: 'linear-gradient(135deg, #E0E7FF, #EEF2FF)', borderRadius: 999, padding: 5, width: 'fit-content', marginBottom: 28, boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.08)' }}>
                        {[
                            { key: 'reports', label: 'Reports', icon: <BarChart3 size={15} /> },
                            { key: 'activity', label: 'Activity Logs', icon: <Activity size={15} /> },
                        ].map(tab => (
                            <button key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={activeTab === tab.key ? 'clay-tab-active' : ''}
                                style={{
                                    padding: '8px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                                    cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 6,
                                    color: activeTab === tab.key ? '#4F46E5' : '#9090B0',
                                    background: activeTab === tab.key ? 'white' : 'transparent',
                                    transition: 'all 0.2s ease',
                                }}>
                                {tab.icon}{tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'reports' && (
                        <>
                            {/* ── STAT CARDS ──────────────────────────────── */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                                {statCards.map((s, i) => {
                                    const Icon = s.icon;
                                    return (
                                        <div key={i} className="clay-stat" style={{ background: s.gradient, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                                            <div className="deco-blob" style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.2)', bottom: -20, right: -20, position: 'absolute' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                                                <div>
                                                    <p style={{ fontSize: 11, fontWeight: 800, color: s.textColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{s.label}</p>
                                                    <p style={{ fontFamily: 'Fraunces, serif', fontSize: 38, fontWeight: 700, color: '#1E1B4B', lineHeight: 1 }}>
                                                        {statsLoading ? <span className="shimmer inline-block w-16 h-9" /> : s.value.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="clay-icon" style={{ width: 48, height: 48, background: s.iconBg, color: s.iconColor }}>
                                                    <Icon size={22} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── CHARTS ROW ──────────────────────────────── */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 28 }}>

                                {/* Appointments Trend */}
                                <div className="clay-chart">
                                    <div style={{ padding: '20px 24px 4px', borderBottom: '1px solid #EEF2FF' }}>
                                        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: '#1E1B4B' }}>Appointments Trend</p>
                                        <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600 }}>{appointmentSubtitle}</p>
                                    </div>
                                    <div style={{ padding: '16px 8px 16px' }}>
                                        {appointmentError ? <ChartError /> : !appointmentData ? <ChartLoader /> : (
                                            <ResponsiveContainer width="100%" height={280}>
                                                <BarChart data={appointmentData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                                                    <XAxis dataKey="label" stroke="#9090B0" tick={{ fontSize: 11, fontWeight: 700, fontFamily: 'Nunito' }} />
                                                    <YAxis stroke="#9090B0" tick={{ fontSize: 11, fontWeight: 700, fontFamily: 'Nunito' }} />
                                                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 0 rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.12)', fontFamily: 'Nunito', fontWeight: 600 }} />
                                                    <Legend wrapperStyle={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12 }} />
                                                    <Bar dataKey="total" name="Total" fill="#6366F1" radius={[10, 10, 0, 0]} />
                                                    <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[10, 10, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Revenue Trend */}
                                <div className="clay-chart">
                                    <div style={{ padding: '20px 24px 4px', borderBottom: '1px solid #EEF2FF' }}>
                                        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: '#1E1B4B' }}>Revenue Trend</p>
                                        <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600 }}>{revenueSubtitle}</p>
                                    </div>
                                    <div style={{ padding: '16px 8px 16px' }}>
                                        {revenueError ? <ChartError /> : !revenueData ? <ChartLoader /> : (
                                            <ResponsiveContainer width="100%" height={280}>
                                                <LineChart data={revenueData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                                                    <XAxis dataKey="label" stroke="#9090B0" tick={{ fontSize: 11, fontWeight: 700, fontFamily: 'Nunito' }} />
                                                    <YAxis stroke="#9090B0" tick={{ fontSize: 11, fontWeight: 700, fontFamily: 'Nunito' }} />
                                                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 0 rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.12)', fontFamily: 'Nunito', fontWeight: 600 }} formatter={(v: any) => `KSh ${v.toLocaleString()}`} />
                                                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 6, strokeWidth: 3, stroke: 'white' }} activeDot={{ r: 8, fill: '#10B981' }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Demographics Pie */}
                                <div className="clay-chart">
                                    <div style={{ padding: '20px 24px 4px', borderBottom: '1px solid #EEF2FF' }}>
                                        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: '#1E1B4B' }}>Demographics by Age</p>
                                        <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600 }}>{demographicsSubtitle}</p>
                                    </div>
                                    <div style={{ padding: '16px 8px 16px' }}>
                                        {demographicsError ? <ChartError /> : !demographicsData ? <ChartLoader /> : (
                                            <ResponsiveContainer width="100%" height={280}>
                                                <PieChart>
                                                    <Pie data={demographicsData} cx="50%" cy="50%" labelLine={false}
                                                        label={({ name, percent }) => `${name} (${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%)`}
                                                        outerRadius={100} dataKey="value">
                                                        {demographicsData.map((_: any, i: number) => (
                                                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 0 rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.12)', fontFamily: 'Nunito', fontWeight: 600 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Insights */}
                                <div className="clay-chart">
                                    <div style={{ padding: '20px 24px 4px', borderBottom: '1px solid #EEF2FF' }}>
                                        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, color: '#1E1B4B' }}>Quick Insights</p>
                                        <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600 }}>Performance at a glance</p>
                                    </div>
                                    <div style={{ padding: '20px 20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div className="clay-insight" style={{ background: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <div className="clay-icon" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', flexShrink: 0 }}>
                                                    <TrendingUp size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 12, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1 }}>Appointment Rate</p>
                                                    <p style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, margin: '2px 0' }}>
                                                        {statsLoading ? '…' : stats?.appointmentGrowth || '+0%'}
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#9090B0', fontWeight: 600 }}>{appointmentRateLabel}</p>
                                                </div>
                                            </div>
                                            <div className="clay-insight" style={{ background: 'linear-gradient(135deg, #DCFCE7, #A7F3D0)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <div className="clay-icon" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', flexShrink: 0 }}>
                                                    <Star size={20} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 12, fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: 1 }}>Completion Rate</p>
                                                    <p style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, margin: '2px 0' }}>
                                                        {statsLoading ? '…' : stats?.completionRate || '0%'}
                                                    </p>
                                                    <p style={{ fontSize: 11, color: '#9090B0', fontWeight: 600 }}>Successful appointments</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── REPORT TYPE CARDS ───────────────────────── */}
                            <div style={{ marginBottom: 10 }}>
                                <p style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: '#1E1B4B', marginBottom: 16 }}>Generate Reports</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
                                {reportTypes.map((r, i) => {
                                    const Icon = r.icon;
                                    return (
                                        <div key={i} className="clay-report-card" style={{ background: 'white' }}>
                                            {/* Coloured strip */}
                                            <div className="report-icon-strip" style={{ background: r.gradient }}>
                                                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div className="clay-icon" style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.25)', color: 'white', backdropFilter: 'blur(8px)', fontSize: 24 }}>
                                                        <Icon size={24} />
                                                    </div>
                                                    <span style={{ fontSize: 28 }}>{r.emoji}</span>
                                                </div>
                                                <p style={{ color: 'white', fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 700, marginTop: 12, position: 'relative', zIndex: 1 }}>{r.title}</p>
                                                <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: 600, marginTop: 3, position: 'relative', zIndex: 1 }}>{r.description}</p>
                                            </div>
                                            {/* Actions */}
                                            <div style={{ padding: '14px 16px', display: 'flex', gap: 8 }}>
                                                <button className="clay-btn-sec"
                                                    onClick={() => setViewingReport({ type: r.type, title: r.title })}
                                                    style={{ flex: 1, padding: '8px 0', fontSize: 12, cursor: 'pointer', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#4C4C72', fontWeight: 800, borderRadius: 999 }}>
                                                    <Eye size={13} /> View
                                                </button>
                                                <button className="clay-btn-sec"
                                                    onClick={() => handleDownloadReport(r.type)}
                                                    style={{ flex: 1, padding: '8px 0', fontSize: 12, cursor: 'pointer', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#4C4C72', fontWeight: 800, borderRadius: 999 }}>
                                                    <Download size={13} /> Download
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── RECENT REPORTS ──────────────────────────── */}
                            <div className="clay-chart">
                                <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #EEF2FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Recent Reports</p>
                                        <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 2 }}>Previously generated documents</p>
                                    </div>
                                    <div className="clay-badge" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                                        <FileText size={11} /> {generatedReports?.reports?.length || 0} reports
                                    </div>
                                </div>
                                <div style={{ padding: '16px 20px' }}>
                                    {!generatedReports?.reports?.length ? (
                                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#9090B0' }}>
                                            <div style={{ width: 56, height: 56, borderRadius: 18, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 0 rgba(0,0,0,0.07), 0 8px 16px rgba(0,0,0,0.05)' }}>
                                                <BarChart3 size={24} style={{ color: '#9090B0' }} />
                                            </div>
                                            <p style={{ fontWeight: 700, fontSize: 14 }}>No reports generated yet</p>
                                            <p style={{ fontSize: 12, marginTop: 4 }}>Click "View" or "Download" to generate your first report.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                            {generatedReports.reports.map((r: any) => (
                                                <div key={r.id} className="clay-log-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', gap: 12 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                                        <div className="clay-icon" style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #EEF2FF, #C7D2FE)', color: '#4F46E5', flexShrink: 0 }}>
                                                            <FileText size={16} />
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.report_name}</p>
                                                            <p style={{ fontSize: 11, color: '#9090B0', fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <button className="clay-btn-sec" onClick={() => handleDownloadReport(r.report_type)}
                                                        style={{ padding: '6px 14px', fontSize: 12, cursor: 'pointer', background: 'white', border: 'none', color: '#4F46E5', fontWeight: 800, borderRadius: 999, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        <Download size={12} /> CSV
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'activity' && (
                        <div className="clay-chart">
                            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #EEF2FF' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                                    <div>
                                        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Activity Logs</p>
                                        <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 2 }}>All system activities — auto-refreshes every 30s</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#DCFCE7', borderRadius: 999, padding: '5px 12px', boxShadow: '0 2px 0 rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)' }}>
                                        <span className="live-dot" style={{ width: 7, height: 7, background: '#10B981', borderRadius: '50%', display: 'inline-block' }} />
                                        <span style={{ fontSize: 12, fontWeight: 800, color: '#15803D' }}>Live</span>
                                    </div>
                                </div>
                                <div className="skeu-panel" style={{ marginTop: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>📌</span>
                                    <p style={{ fontSize: 12, color: '#4C4C72', fontWeight: 600 }}>Captures all activities including logins, registrations, appointments, and more.</p>
                                </div>
                            </div>
                            <div style={{ padding: '16px 20px' }}>
                                <ActivityLogsSection />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {viewingReport && (
                <ReportViewModal
                    isOpen={true}
                    onClose={() => setViewingReport(null)}
                    reportType={viewingReport.type}
                    reportTitle={viewingReport.title}
                    period={selectedPeriod}
                />
            )}
        </>
    );
}

// ─── Chart placeholder helpers ────────────────────────────────────────────────
function ChartLoader() {
    return (
        <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div className="shimmer" style={{ width: '100%', height: '100%', borderRadius: 12 }} />
        </div>
    );
}
function ChartError() {
    return (
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9090B0', fontWeight: 600, fontSize: 13 }}>
            Unable to load chart data
        </div>
    );
}