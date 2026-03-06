'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import useSWR from 'swr';
import { useState } from 'react';
import {
    Calendar, Clock, CheckCircle2, XCircle, PartyPopper,
    Ban, Search, RefreshCw, Eye, Pencil, Baby
} from 'lucide-react';

// ─── Clay Design System ───────────────────────────────────────────────────────
const clayCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,700&display=swap');

  :root {
    --bg: #EEF2FF;
    --surface: #FFFFFF;
    --indigo: #6366F1; --indigo-l: #C7D2FE;
    --amber: #F59E0B;  --amber-l: #FDE68A;
    --sky: #0EA5E9;    --sky-l: #BAE6FD;
    --emerald: #10B981;--emerald-l: #A7F3D0;
    --rose: #F43F5E;   --rose-l: #FECDD3;
    --slate-l: #F1F5F9;--slate-m: #94A3B8;
    --purple: #8B5CF6; --purple-l: #DDD6FE;
    --text-dark: #1E1B4B; --text-mid: #4C4C72; --text-muted: #9090B0;
    --clay-sm: 0 4px 0 rgba(0,0,0,.12), 0 6px 16px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.7);
    --clay-md: 0 6px 0 rgba(0,0,0,.13), 0 10px 24px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.65);
    --clay-lg: 0 8px 0 rgba(0,0,0,.14), 0 16px 40px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.6);
    --clay-pressed: 0 2px 0 rgba(0,0,0,.12), 0 3px 8px rgba(0,0,0,.08), inset 0 2px 4px rgba(0,0,0,.08);
    --spring: cubic-bezier(0.34,1.56,0.64,1);
    --ease: cubic-bezier(0.16,1,0.3,1);
  }

  .clay-page * { font-family: 'Nunito', sans-serif !important; box-sizing: border-box; }

  /* noise grain overlay */
  .clay-page::before {
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    opacity:.35;
  }

  /* ── STAT CARD ── */
  .clay-stat {
    border-radius: 24px !important;
    box-shadow: var(--clay-md) !important;
    border: none !important;
    transition: transform .2s var(--spring), box-shadow .2s ease;
    overflow: hidden; position: relative; cursor: default;
  }
  .clay-stat:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 12px 0 rgba(0,0,0,.13), 0 20px 48px rgba(0,0,0,.13), inset 0 1px 0 rgba(255,255,255,.65) !important;
  }
  .clay-stat:active { transform: translateY(3px); box-shadow: var(--clay-pressed) !important; }
  .clay-stat .stat-blob {
    position:absolute; border-radius:50%; pointer-events:none;
    background:rgba(255,255,255,.12);
  }

  /* ── CLAY ICON BUBBLE ── */
  .clay-ico {
    border-radius: 16px;
    box-shadow: 0 4px 0 rgba(0,0,0,.15), 0 8px 16px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.5);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    transition: transform .22s var(--spring);
  }
  .clay-stat:hover .clay-ico { transform: rotate(-10deg) scale(1.15); }

  /* ── SURFACE CARD ── */
  .clay-card {
    border-radius: 24px !important;
    box-shadow: var(--clay-md) !important;
    border: none !important;
    background: white;
    overflow: hidden;
  }

  /* ── FILTER BAR ── */
  .clay-filter {
    border-radius: 24px !important;
    box-shadow: var(--clay-sm) !important;
    border: none !important;
    background: white;
  }

  /* ── SEARCH INPUT ── */
  .clay-search {
    border-radius: 999px !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.07), inset 0 -1px 0 rgba(255,255,255,.8), 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #C7D2FE !important;
    font-weight: 600 !important;
    background: #FAFBFF !important;
    padding-left: 40px !important;
    transition: border-color .2s, box-shadow .2s;
  }
  .clay-search:focus {
    border-color: var(--indigo) !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.05), 0 0 0 3px rgba(99,102,241,.12) !important;
    outline: none !important;
  }

  /* ── DATE INPUT ── */
  .clay-date {
    border-radius: 999px !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.07), 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #C7D2FE !important;
    font-weight: 600 !important;
    background: #FAFBFF !important;
    transition: border-color .2s;
  }
  .clay-date:focus { border-color: var(--indigo) !important; outline: none !important; }

  /* ── STATUS FILTER PILLS ── */
  .clay-pill {
    border-radius: 999px; border: none; cursor: pointer; font-weight: 700;
    font-family: 'Nunito', sans-serif; transition: transform .18s var(--spring), box-shadow .18s ease;
    box-shadow: 0 3px 0 rgba(0,0,0,.08), 0 5px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.8);
  }
  .clay-pill:hover { transform: translateY(-2px); box-shadow: 0 5px 0 rgba(0,0,0,.1), 0 8px 20px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.8); }
  .clay-pill:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,.08), inset 0 2px 4px rgba(0,0,0,.08); }
  .clay-pill-active {
    box-shadow: 0 4px 0 rgba(99,102,241,.3), 0 6px 16px rgba(99,102,241,.25), inset 0 1px 0 rgba(255,255,255,.25);
    background: var(--indigo); color: white;
  }
  .clay-pill-active:hover { box-shadow: 0 6px 0 rgba(99,102,241,.35), 0 10px 24px rgba(99,102,241,.28), inset 0 1px 0 rgba(255,255,255,.25); }

  /* ── REFRESH BUTTON ── */
  .clay-refresh {
    border-radius: 999px !important;
    box-shadow: 0 4px 0 rgba(0,0,0,.1), 0 6px 16px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #C7D2FE !important;
    background: white !important;
    transition: transform .2s var(--spring), box-shadow .2s ease !important;
  }
  .clay-refresh:hover { transform: translateY(-2px) rotate(15deg) !important; box-shadow: 0 6px 0 rgba(0,0,0,.1), 0 10px 24px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.9) !important; }
  .clay-refresh:active { transform: translateY(2px) rotate(0deg) !important; box-shadow: var(--clay-pressed) !important; }

  /* ── PRIMARY CTA BUTTON ── */
  .clay-cta {
    border-radius: 999px !important; border: none !important;
    box-shadow: 0 5px 0 rgba(16,185,129,.35), 0 8px 20px rgba(16,185,129,.25), inset 0 1px 0 rgba(255,255,255,.3) !important;
    font-weight: 800 !important; font-family: 'Nunito', sans-serif !important;
    transition: transform .2s var(--spring), box-shadow .2s ease !important;
    background: linear-gradient(135deg, #10B981, #059669) !important;
    color: white !important;
  }
  .clay-cta:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 0 rgba(16,185,129,.4), 0 14px 32px rgba(16,185,129,.3), inset 0 1px 0 rgba(255,255,255,.3) !important; }
  .clay-cta:active { transform: translateY(3px) !important; box-shadow: 0 2px 0 rgba(16,185,129,.3), inset 0 2px 4px rgba(0,0,0,.1) !important; }

  /* ── SECONDARY BUTTON ── */
  .clay-btn-sec {
    border-radius: 999px !important;
    box-shadow: 0 3px 0 rgba(0,0,0,.08), 0 5px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #E0E7FF !important;
    background: white !important; font-weight: 700 !important;
    transition: transform .18s var(--spring), box-shadow .18s ease !important;
  }
  .clay-btn-sec:hover { transform: translateY(-2px) !important; box-shadow: 0 5px 0 rgba(0,0,0,.1), 0 8px 20px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.9) !important; }
  .clay-btn-sec:active { transform: translateY(2px) !important; box-shadow: 0 1px 0 rgba(0,0,0,.08), inset 0 2px 4px rgba(0,0,0,.06) !important; }

  /* ── TABLE ── */
  .clay-table-head {
    background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  }
  .clay-table-head th {
    color: var(--indigo); font-weight: 800; font-size: 11px;
    text-transform: uppercase; letter-spacing: 1px;
    font-family: 'Nunito', sans-serif;
  }
  .clay-table-row { transition: background .15s ease; }
  .clay-table-row:hover { background: #F5F3FF !important; }

  /* ── CHILD AVATAR ── */
  .clay-avatar {
    border-radius: 50%;
    box-shadow: 0 4px 0 rgba(139,92,246,.3), 0 6px 16px rgba(139,92,246,.2), inset 0 1px 0 rgba(255,255,255,.4);
    transition: transform .22s var(--spring);
  }
  .clay-table-row:hover .clay-avatar { transform: scale(1.12) rotate(-5deg); }

  /* ── STATUS BADGE ── */
  .clay-status {
    border-radius: 999px;
    box-shadow: 0 2px 0 rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.6);
    display: inline-flex; align-items: center; gap: 5px;
    font-weight: 800; font-size: 11px; padding: 4px 10px;
    font-family: 'Nunito', sans-serif;
  }

  /* ── MOBILE CARD ── */
  .clay-mob-card {
    border-radius: 18px;
    background: linear-gradient(135deg, #FAFBFF, #F0F4FF);
    box-shadow: 0 2px 0 rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.9);
    margin-bottom: 10px;
    transition: transform .18s var(--spring), box-shadow .18s ease;
  }
  .clay-mob-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 0 rgba(0,0,0,.07), 0 10px 24px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.9);
  }

  /* ── SKELETON ── */
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .shimmer {
    background: linear-gradient(90deg, #EEF2FF 25%, #E0E7FF 50%, #EEF2FF 75%);
    background-size: 400px 100%; animation: shimmer 1.4s ease-in-out infinite;
    border-radius: 16px;
  }

  /* ── MODAL ── */
  .clay-modal-overlay { background: rgba(30,27,75,.4); backdrop-filter: blur(8px); }
  .clay-modal-inner {
    border-radius: 28px !important;
    box-shadow: 0 24px 0 rgba(0,0,0,.12), 0 40px 80px rgba(0,0,0,.18) !important;
    border: 2px solid rgba(255,255,255,.8) !important;
    background: #FAFBFF !important;
  }

  /* ── MODAL FIELD ── */
  .clay-field {
    border-radius: 14px !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.07), inset 0 -1px 0 rgba(255,255,255,.8) !important;
    border: 1.5px solid #C7D2FE !important;
    font-weight: 600 !important; background: #FAFBFF !important;
    font-family: 'Nunito', sans-serif !important;
    transition: border-color .2s, box-shadow .2s;
  }
  .clay-field:focus {
    border-color: var(--indigo) !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.05), 0 0 0 3px rgba(99,102,241,.12) !important;
    outline: none !important;
  }

  /* ── MODAL INFO ROW ── */
  .clay-info-row {
    border-radius: 14px;
    background: linear-gradient(135deg, #F5F3FF, #EEF2FF);
    box-shadow: inset 0 2px 5px rgba(0,0,0,.06), inset 0 -1px 0 rgba(255,255,255,.7);
    border: 1px solid rgba(199,210,254,.5);
    padding: 14px 16px;
  }

  /* ── MODAL PRIMARY BTN ── */
  .clay-modal-save {
    border-radius: 999px !important; border: none !important;
    box-shadow: 0 5px 0 rgba(99,102,241,.35), 0 8px 20px rgba(99,102,241,.25), inset 0 1px 0 rgba(255,255,255,.3) !important;
    font-weight: 800 !important; font-family: 'Nunito', sans-serif !important;
    background: linear-gradient(135deg, #6366F1, #4F46E5) !important; color: white !important;
    transition: transform .2s var(--spring), box-shadow .2s ease !important;
  }
  .clay-modal-save:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 0 rgba(99,102,241,.4), 0 14px 32px rgba(99,102,241,.3), inset 0 1px 0 rgba(255,255,255,.3) !important; }
  .clay-modal-save:active { transform: translateY(3px) !important; }
  .clay-modal-save:disabled { opacity:.6; transform: none !important; }

  /* ── MODAL CLOSE BTN ── */
  .clay-modal-close {
    border-radius: 999px !important; cursor: pointer;
    box-shadow: 0 3px 0 rgba(0,0,0,.08), 0 5px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #E0E7FF !important; background: white !important; font-weight: 700 !important;
    transition: transform .18s var(--spring) !important;
  }
  .clay-modal-close:hover { transform: translateY(-2px) !important; }

  /* ── DECORATIVE BLOBS ── */
  @keyframes blobFloat { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.06) rotate(4deg)} }
  .deco-blob { position:absolute; border-radius:50%; pointer-events:none; animation:blobFloat 7s ease-in-out infinite; }

  /* ── LABEL ── */
  .clay-label { font-size:11px; font-weight:800; color:var(--indigo); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; display:block; }

  /* ── EMPTY STATE ── */
  .clay-empty-ico {
    width:72px; height:72px; border-radius:22px;
    background:linear-gradient(135deg,#EEF2FF,#C7D2FE);
    box-shadow: var(--clay-sm);
    display:flex; align-items:center; justify-content:center;
    margin: 0 auto 14px;
    animation: blobFloat 4s ease-in-out infinite;
  }
`;

// ─── Fetcher ──────────────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface Appointment {
    id: string; child_id: string; caregiver_id: string; doctor_id?: string;
    scheduled_for: string; status: string; notes?: string;
    child: { full_name: string };
    caregiver?: { profiles: { full_name: string } };
    doctor?: { profiles: { full_name: string } };
}
interface Child { id: string; full_name: string; }
interface Caregiver { id: string; profiles: { full_name: string }; }
interface Doctor { user_id: string; profiles: { full_name: string }; }

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    pending:   { bg: '#FEF9C3', color: '#A16207', icon: <Clock size={11} /> },
    confirmed: { bg: '#DBEAFE', color: '#1D4ED8', icon: <CheckCircle2 size={11} /> },
    completed: { bg: '#DCFCE7', color: '#15803D', icon: <PartyPopper size={11} /> },
    cancelled: { bg: '#FFE4E6', color: '#BE123C', icon: <XCircle size={11} /> },
    'no-show': { bg: '#F1F5F9', color: '#475569', icon: <Ban size={11} /> },
};
const getStatus = (s: string) => statusConfig[s] || { bg: '#F1F5F9', color: '#475569', icon: <Calendar size={11} /> };

// ─── Clay form field wrapper ──────────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <span className="clay-label">{label}</span>
            {children}
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AppointmentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [viewAppointment, setViewAppointment] = useState<Appointment | null>(null);
    const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editForm, setEditForm] = useState({ child_id: '', caregiver_id: '', doctor_id: '', scheduled_for: '', status: 'pending', notes: '' });
    const [addForm, setAddForm] = useState({ child_id: '', caregiver_id: '', doctor_id: '', scheduled_for: '', status: 'pending', notes: '' });

    const { data: appointments, error, isLoading, mutate } = useSWR<Appointment[]>('/api/admin/appointments', fetcher);
    const { data: children } = useSWR<Child[]>('/api/admin/children', fetcher);
    const { data: caregivers } = useSWR<Caregiver[]>('/api/admin/caregivers', fetcher);
    const { data: doctors } = useSWR<Doctor[]>('/api/admin/doctors', fetcher);

    const filteredAppointments = appointments?.filter((apt) => {
        const matchesSearch =
            apt.child?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.caregiver?.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
        const matchesDate = !dateFilter || apt.scheduled_for?.startsWith(dateFilter);
        return matchesSearch && matchesStatus && matchesDate;
    }) || [];

    const stats = {
        total: appointments?.length || 0,
        pending: appointments?.filter(a => a.status === 'pending').length || 0,
        confirmed: appointments?.filter(a => a.status === 'confirmed').length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
    };

    const handleEdit = (apt: Appointment) => {
        setEditAppointment(apt);
        setEditForm({
            child_id: apt.child_id || '', caregiver_id: apt.caregiver_id || '',
            doctor_id: apt.doctor_id || '',
            scheduled_for: apt.scheduled_for ? new Date(apt.scheduled_for).toISOString().slice(0, 16) : '',
            status: apt.status || 'pending', notes: apt.notes || ''
        });
    };

    const handleSaveEdit = async () => {
        if (!editAppointment) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/appointments/${editAppointment.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error('Failed to update');
            await mutate(); setEditAppointment(null);
        } catch { alert('Failed to update appointment. Please try again.'); }
        finally { setIsSaving(false); }
    };

    const handleAddAppointment = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/appointments', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addForm),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create'); }
            await mutate(); setShowAddModal(false);
            setAddForm({ child_id: '', caregiver_id: '', doctor_id: '', scheduled_for: '', status: 'pending', notes: '' });
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed to create appointment.'); }
        finally { setIsSaving(false); }
    };

    if (error) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <div className="clay-stat" style={{ background: '#FFF1F2', padding: '32px 40px', textAlign: 'center' }}>
                <p style={{ color: '#F43F5E', fontSize: 18, fontWeight: 800, fontFamily: 'Nunito' }}>Error loading appointments</p>
                <p style={{ color: '#9090B0', marginTop: 8, fontFamily: 'Nunito' }}>Please try refreshing the page</p>
            </div>
        </div>
    );

    // ── Shared select style ──
    const selectStyle: React.CSSProperties = {
        borderRadius: 14, border: '1.5px solid #C7D2FE',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,.07), inset 0 -1px 0 rgba(255,255,255,.8)',
        background: '#FAFBFF', fontWeight: 600, fontFamily: 'Nunito',
        padding: '9px 12px', width: '100%', cursor: 'pointer', fontSize: 14, color: '#1E1B4B',
        appearance: 'none',
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: clayCSS }} />

            <div className="clay-page" style={{ background: 'var(--bg)', minHeight: '100vh', padding: '0 0 48px', position: 'relative' }}>

                {/* Decorative blobs */}
                <div className="deco-blob" style={{ width: 360, height: 360, background: 'radial-gradient(circle,rgba(99,102,241,.07),transparent 70%)', top: -80, right: -80, position: 'fixed' }} />
                <div className="deco-blob" style={{ width: 260, height: 260, background: 'radial-gradient(circle,rgba(16,185,129,.06),transparent 70%)', bottom: 120, left: -60, position: 'fixed', animationDelay: '3.5s' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>

                    {/* ── PAGE HEADER ─────────────────────────────────────── */}
                    <div style={{ padding: '32px 0 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="clay-ico" style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white' }}>
                                <Calendar size={22} />
                            </div>
                            <div>
                                <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 700, color: '#1E1B4B', lineHeight: 1 }}>Appointments</h1>
                                <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 3 }}>Manage all system appointments</p>
                            </div>
                        </div>
                        <button className="clay-cta" onClick={() => setShowAddModal(true)}
                            style={{ padding: '12px 26px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Appointment
                        </button>
                    </div>

                    {/* ── STAT CARDS ──────────────────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
                        {[
                            { label: 'Total', value: stats.total, gradient: 'linear-gradient(135deg,#EEF2FF,#C7D2FE)', iconBg: 'linear-gradient(135deg,#6366F1,#4F46E5)', tc: '#4F46E5', Icon: Calendar },
                            { label: 'Pending', value: stats.pending, gradient: 'linear-gradient(135deg,#FFFBEB,#FDE68A)', iconBg: 'linear-gradient(135deg,#F59E0B,#D97706)', tc: '#B45309', Icon: Clock },
                            { label: 'Confirmed', value: stats.confirmed, gradient: 'linear-gradient(135deg,#EFF6FF,#BAE6FD)', iconBg: 'linear-gradient(135deg,#0EA5E9,#0284C7)', tc: '#0369A1', Icon: CheckCircle2 },
                            { label: 'Completed', value: stats.completed, gradient: 'linear-gradient(135deg,#ECFDF5,#A7F3D0)', iconBg: 'linear-gradient(135deg,#10B981,#059669)', tc: '#15803D', Icon: PartyPopper },
                        ].map((s, i) => (
                            <div key={i} className="clay-stat" style={{ background: s.gradient, padding: '18px 20px' }}>
                                <div className="stat-blob" style={{ width: 90, height: 90, bottom: -25, right: -25 }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                                    <div>
                                        <p style={{ fontSize: 10, fontWeight: 800, color: s.tc, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</p>
                                        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, marginTop: 4 }}>{s.value}</p>
                                    </div>
                                    <div className="clay-ico" style={{ width: 44, height: 44, background: s.iconBg, color: 'white' }}>
                                        <s.Icon size={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── FILTERS ─────────────────────────────────────────── */}
                    <div className="clay-filter" style={{ padding: '18px 20px', marginBottom: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9090B0', pointerEvents: 'none' }} />
                                <input
                                    className="clay-search"
                                    placeholder="Search by child or caregiver…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px 10px 40px', fontSize: 14, color: '#1E1B4B' }}
                                />
                            </div>

                            {/* Status pills + date + refresh */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
                                        <button key={s}
                                            className={`clay-pill ${statusFilter === s ? 'clay-pill-active' : ''}`}
                                            onClick={() => setStatusFilter(s)}
                                            style={{
                                                padding: '6px 14px', fontSize: 12,
                                                background: statusFilter === s ? undefined : 'white',
                                                color: statusFilter === s ? undefined : '#4C4C72',
                                            }}>
                                            {s === 'all' ? '✦ All' : s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                                        className="clay-date"
                                        style={{ padding: '8px 14px', fontSize: 13, color: '#1E1B4B', cursor: 'pointer' }} />
                                    <button className="clay-refresh" onClick={() => mutate()}
                                        style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6366F1' }}>
                                        <RefreshCw size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── APPOINTMENTS TABLE/LIST ──────────────────────────── */}
                    <div className="clay-card">
                        {/* Table header */}
                        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid #EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <p style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Appointments</p>
                                <span style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 800, boxShadow: '0 2px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.7)' }}>
                                    {filteredAppointments.length}
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '16px' }}>
                            {isLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="shimmer" style={{ height: 64 }} />)}
                                </div>
                            ) : filteredAppointments.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                    <div className="clay-empty-ico">
                                        <Calendar size={30} style={{ color: '#6366F1' }} />
                                    </div>
                                    <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 16 }}>No appointments found</p>
                                    <p style={{ fontSize: 13, color: '#9090B0', marginTop: 6 }}>Try adjusting your filters</p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop table */}
                                    <div style={{ display: 'none' }} className="lg-table-wrap">
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr className="clay-table-head">
                                                    {['Child', 'Caregiver', 'Doctor', 'Date & Time', 'Status', 'Actions'].map(h => (
                                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredAppointments.map((apt) => {
                                                    const st = getStatus(apt.status);
                                                    return (
                                                        <tr key={apt.id} className="clay-table-row" style={{ borderBottom: '1px solid #EEF2FF' }}>
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <div className="clay-avatar" style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                                        <Baby size={17} />
                                                                    </div>
                                                                    <span style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14 }}>{apt.child?.full_name || 'Unknown'}</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '14px 16px', color: '#4C4C72', fontWeight: 600, fontSize: 14 }}>{apt.caregiver?.profiles?.full_name || 'N/A'}</td>
                                                            <td style={{ padding: '14px 16px', color: '#4C4C72', fontWeight: 600, fontSize: 14 }}>{apt.doctor?.profiles?.full_name || 'Not assigned'}</td>
                                                            <td style={{ padding: '14px 16px' }}>
                                                                {apt.scheduled_for ? (
                                                                    <div>
                                                                        <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14 }}>{new Date(apt.scheduled_for).toLocaleDateString()}</p>
                                                                        <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600 }}>{new Date(apt.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                    </div>
                                                                ) : 'N/A'}
                                                            </td>
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <span className="clay-status" style={{ background: st.bg, color: st.color }}>{st.icon} {apt.status}</span>
                                                            </td>
                                                            <td style={{ padding: '14px 16px' }}>
                                                                <div style={{ display: 'flex', gap: 7 }}>
                                                                    <button className="clay-btn-sec" onClick={() => setViewAppointment(apt)}
                                                                        style={{ padding: '6px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#4C4C72' }}>
                                                                        <Eye size={13} /> View
                                                                    </button>
                                                                    <button className="clay-btn-sec" onClick={() => handleEdit(apt)}
                                                                        style={{ padding: '6px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#4C4C72' }}>
                                                                        <Pencil size={13} /> Edit
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile + fallback card list */}
                                    <div>
                                        {filteredAppointments.map((apt) => {
                                            const st = getStatus(apt.status);
                                            return (
                                                <div key={apt.id} className="clay-mob-card" style={{ padding: '14px 16px' }}>
                                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                                        {/* Avatar */}
                                                        <div className="clay-avatar" style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                                                            <Baby size={18} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            {/* Top row */}
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                                <div style={{ minWidth: 0 }}>
                                                                    <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apt.child?.full_name || 'Unknown'}</p>
                                                                    <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 1 }}>{apt.caregiver?.profiles?.full_name || 'No caregiver'}</p>
                                                                </div>
                                                                <span className="clay-status" style={{ background: st.bg, color: st.color, flexShrink: 0 }}>{st.icon} {apt.status}</span>
                                                            </div>
                                                            {/* Date + doctor row */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
                                                                <div style={{ fontSize: 12, color: '#4C4C72', fontWeight: 600 }}>
                                                                    {apt.scheduled_for ? (
                                                                        <span>📅 {new Date(apt.scheduled_for).toLocaleDateString()} · {new Date(apt.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    ) : 'No date set'}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: 8 }}>
                                                                    <button className="clay-btn-sec" onClick={() => setViewAppointment(apt)}
                                                                        style={{ padding: '5px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#6366F1' }}>
                                                                        <Eye size={11} /> View
                                                                    </button>
                                                                    <button className="clay-btn-sec" onClick={() => handleEdit(apt)}
                                                                        style={{ padding: '5px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#6366F1' }}>
                                                                        <Pencil size={11} /> Edit
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {apt.doctor?.profiles?.full_name && (
                                                                <p style={{ fontSize: 11, color: '#9090B0', fontWeight: 600, marginTop: 6 }}>🩺 Dr. {apt.doctor.profiles.full_name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── VIEW MODAL ───────────────────────────────────────── */}
                    <Modal isOpen={!!viewAppointment} onClose={() => setViewAppointment(null)}>
                        <ModalHeader>
                            <ModalTitle>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="clay-ico" style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: 'white' }}>
                                        <Calendar size={17} />
                                    </div>
                                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Appointment Details</span>
                                </div>
                            </ModalTitle>
                        </ModalHeader>
                        <ModalContent>
                            {viewAppointment && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[
                                        { label: 'Child', value: viewAppointment.child?.full_name || 'N/A' },
                                        { label: 'Caregiver', value: viewAppointment.caregiver?.profiles?.full_name || 'N/A' },
                                        { label: 'Doctor', value: viewAppointment.doctor?.profiles?.full_name || 'Not assigned' },
                                        { label: 'Scheduled For', value: viewAppointment.scheduled_for ? new Date(viewAppointment.scheduled_for).toLocaleString() : 'N/A' },
                                    ].map(row => (
                                        <div key={row.label} className="clay-info-row">
                                            <span className="clay-label" style={{ marginBottom: 4 }}>{row.label}</span>
                                            <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 15 }}>{row.value}</p>
                                        </div>
                                    ))}
                                    <div className="clay-info-row">
                                        <span className="clay-label" style={{ marginBottom: 6 }}>Status</span>
                                        {(() => { const st = getStatus(viewAppointment.status); return <span className="clay-status" style={{ background: st.bg, color: st.color }}>{st.icon} {viewAppointment.status}</span>; })()}
                                    </div>
                                    {viewAppointment.notes && (
                                        <div className="clay-info-row">
                                            <span className="clay-label" style={{ marginBottom: 4 }}>Notes</span>
                                            <p style={{ color: '#4C4C72', fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>{viewAppointment.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ModalContent>
                        <ModalFooter>
                            <button className="clay-modal-close" onClick={() => setViewAppointment(null)}
                                style={{ padding: '10px 24px', fontSize: 14, fontFamily: 'Nunito' }}>
                                Close
                            </button>
                        </ModalFooter>
                    </Modal>

                    {/* ── EDIT MODAL ───────────────────────────────────────── */}
                    <Modal isOpen={!!editAppointment} onClose={() => setEditAppointment(null)}>
                        <ModalHeader>
                            <ModalTitle>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="clay-ico" style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: 'white' }}>
                                        <Pencil size={17} />
                                    </div>
                                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Edit Appointment</span>
                                </div>
                            </ModalTitle>
                        </ModalHeader>
                        <ModalContent>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <FieldRow label="Child">
                                    <select className="clay-field" value={editForm.child_id} onChange={e => setEditForm({ ...editForm, child_id: e.target.value })} style={selectStyle}>
                                        <option value="">Select child</option>
                                        {children?.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                    </select>
                                </FieldRow>
                                <FieldRow label="Caregiver">
                                    <select className="clay-field" value={editForm.caregiver_id} onChange={e => setEditForm({ ...editForm, caregiver_id: e.target.value })} style={selectStyle}>
                                        <option value="">Select caregiver</option>
                                        {caregivers?.map(c => <option key={c.id} value={c.id}>{c.profiles.full_name}</option>)}
                                    </select>
                                </FieldRow>
                                <FieldRow label="Doctor">
                                    <select className="clay-field" value={editForm.doctor_id} onChange={e => setEditForm({ ...editForm, doctor_id: e.target.value })} style={selectStyle}>
                                        <option value="">Select doctor</option>
                                        {doctors?.map(d => <option key={d.user_id} value={d.user_id}>{d.profiles.full_name}</option>)}
                                    </select>
                                </FieldRow>
                                <FieldRow label="Scheduled For">
                                    <input type="datetime-local" className="clay-field" value={editForm.scheduled_for}
                                        onChange={e => setEditForm({ ...editForm, scheduled_for: e.target.value })}
                                        style={{ ...selectStyle, borderRadius: 14 }} />
                                </FieldRow>
                                <FieldRow label="Status">
                                    <select className="clay-field" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={selectStyle}>
                                        {['pending', 'confirmed', 'completed', 'cancelled', 'no-show'].map(s => (
                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                        ))}
                                    </select>
                                </FieldRow>
                                <FieldRow label="Notes">
                                    <textarea className="clay-field" value={editForm.notes} rows={3}
                                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                        placeholder="Optional notes…"
                                        style={{ ...selectStyle, borderRadius: 14, resize: 'vertical', lineHeight: 1.5 }} />
                                </FieldRow>
                            </div>
                        </ModalContent>
                        <ModalFooter>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button className="clay-modal-close" onClick={() => setEditAppointment(null)}
                                    style={{ padding: '10px 22px', fontSize: 14 }}>Cancel</button>
                                <button className="clay-modal-save" onClick={handleSaveEdit} disabled={isSaving}
                                    style={{ padding: '10px 26px', fontSize: 14, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                                    {isSaving ? '⏳ Saving…' : '💾 Save Changes'}
                                </button>
                            </div>
                        </ModalFooter>
                    </Modal>

                    {/* ── ADD MODAL ────────────────────────────────────────── */}
                    <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
                        <ModalHeader>
                            <ModalTitle>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div className="clay-ico" style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white' }}>
                                        <Calendar size={17} />
                                    </div>
                                    <span style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>New Appointment</span>
                                </div>
                            </ModalTitle>
                        </ModalHeader>
                        <ModalContent>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <FieldRow label="Child">
                                    <select className="clay-field" value={addForm.child_id} onChange={e => setAddForm({ ...addForm, child_id: e.target.value })} style={selectStyle}>
                                        <option value="">Select child</option>
                                        {children?.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                    </select>
                                </FieldRow>
                                <FieldRow label="Caregiver">
                                    <select className="clay-field" value={addForm.caregiver_id} onChange={e => setAddForm({ ...addForm, caregiver_id: e.target.value })} style={selectStyle}>
                                        <option value="">Select caregiver</option>
                                        {caregivers?.map(c => <option key={c.id} value={c.id}>{c.profiles.full_name}</option>)}
                                    </select>
                                </FieldRow>
                                <FieldRow label="Doctor">
                                    <select className="clay-field" value={addForm.doctor_id} onChange={e => setAddForm({ ...addForm, doctor_id: e.target.value })} style={selectStyle}>
                                        <option value="">Select doctor</option>
                                        {doctors?.map(d => <option key={d.user_id} value={d.user_id}>{d.profiles.full_name}</option>)}
                                    </select>
                                </FieldRow>
                                <FieldRow label="Scheduled For">
                                    <input type="datetime-local" className="clay-field" value={addForm.scheduled_for}
                                        onChange={e => setAddForm({ ...addForm, scheduled_for: e.target.value })}
                                        style={{ ...selectStyle, borderRadius: 14 }} />
                                </FieldRow>
                                <FieldRow label="Status">
                                    <select className="clay-field" value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })} style={selectStyle}>
                                        {['pending', 'confirmed', 'completed', 'cancelled', 'no-show'].map(s => (
                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                        ))}
                                    </select>
                                </FieldRow>
                                <FieldRow label="Notes">
                                    <textarea className="clay-field" value={addForm.notes} rows={3}
                                        onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                                        placeholder="Optional notes…"
                                        style={{ ...selectStyle, borderRadius: 14, resize: 'vertical', lineHeight: 1.5 }} />
                                </FieldRow>
                            </div>
                        </ModalContent>
                        <ModalFooter>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button className="clay-modal-close" onClick={() => setShowAddModal(false)}
                                    style={{ padding: '10px 22px', fontSize: 14 }}>Cancel</button>
                                <button className="clay-modal-save" onClick={handleAddAppointment} disabled={isSaving}
                                    style={{ padding: '10px 26px', fontSize: 14, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                                    {isSaving ? '⏳ Creating…' : '✅ Create Appointment'}
                                </button>
                            </div>
                        </ModalFooter>
                    </Modal>

                </div>
            </div>
        </>
    );
}