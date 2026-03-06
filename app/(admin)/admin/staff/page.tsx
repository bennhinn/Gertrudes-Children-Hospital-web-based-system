'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import useSWR from 'swr';
import { useState } from 'react';
import { Stethoscope, Briefcase, FlaskConical, Pill, Package, User, LucideIcon, Search, Eye, Pencil, UserPlus, RefreshCw } from 'lucide-react';

// ─── Clay Design System ───────────────────────────────────────────────────────
const clayCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');

  :root {
    --bg: #EEF2FF;
    --indigo: #6366F1; --indigo-s: #EEF2FF; --indigo-l: #C7D2FE;
    --purple: #8B5CF6; --purple-s: #EDE9FE; --purple-l: #DDD6FE;
    --emerald: #10B981; --emerald-s: #ECFDF5; --emerald-l: #A7F3D0;
    --amber: #F59E0B;  --amber-s: #FFFBEB;  --amber-l: #FDE68A;
    --cyan: #06B6D4;   --cyan-s: #ECFEFF;   --cyan-l: #A5F3FC;
    --orange: #F97316; --orange-s: #FFF7ED; --orange-l: #FED7AA;
    --rose: #F43F5E;   --rose-s: #FFF1F2;   --rose-l: #FECDD3;
    --sky: #0EA5E9;    --sky-s: #F0F9FF;    --sky-l: #BAE6FD;
    --text-dark: #1E1B4B; --text-mid: #4C4C72; --text-muted: #9090B0;
    --clay-sm:  0 4px 0 rgba(0,0,0,.12), 0 6px 16px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.7);
    --clay-md:  0 6px 0 rgba(0,0,0,.13), 0 10px 24px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.65);
    --clay-lg:  0 8px 0 rgba(0,0,0,.14), 0 16px 40px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.6);
    --clay-pressed: 0 2px 0 rgba(0,0,0,.12), inset 0 2px 4px rgba(0,0,0,.08);
    --spring: cubic-bezier(0.34,1.56,0.64,1);
  }

  .clay-page * { font-family: 'Nunito', sans-serif !important; box-sizing: border-box; }
  .clay-page::before {
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    opacity:.35;
  }

  /* ── CLAY SURFACE ── */
  .clay-card {
    border-radius: 24px !important; border: none !important;
    box-shadow: var(--clay-md) !important; background: white; overflow: hidden;
  }

  /* ── STAT MINI CARD ── */
  .clay-stat {
    border-radius: 20px !important; border: none !important;
    box-shadow: var(--clay-md) !important;
    transition: transform .2s var(--spring), box-shadow .2s ease;
    overflow: hidden; position: relative;
  }
  .clay-stat:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 12px 0 rgba(0,0,0,.13), 0 20px 48px rgba(0,0,0,.13), inset 0 1px 0 rgba(255,255,255,.65) !important;
  }
  .clay-stat:active { transform: translateY(3px); box-shadow: var(--clay-pressed) !important; }
  .stat-blob { position:absolute; border-radius:50%; pointer-events:none; background:rgba(255,255,255,.15); }

  /* ── ICON BUBBLE ── */
  .clay-ico {
    border-radius: 16px;
    box-shadow: 0 4px 0 rgba(0,0,0,.15), 0 8px 16px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.5);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: transform .22s var(--spring);
  }

  /* ── SEARCH INPUT ── */
  .clay-search {
    border-radius: 999px !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.07), inset 0 -1px 0 rgba(255,255,255,.8) !important;
    border: 1.5px solid #C7D2FE !important;
    font-weight: 600 !important; background: #FAFBFF !important;
    transition: border-color .2s, box-shadow .2s;
  }
  .clay-search:focus {
    border-color: var(--indigo) !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.05), 0 0 0 3px rgba(99,102,241,.12) !important;
    outline: none !important;
  }

  /* ── FILTER PILLS ── */
  .clay-pill {
    border-radius: 999px; border: none; cursor: pointer;
    font-weight: 700; font-family: 'Nunito', sans-serif;
    transition: transform .18s var(--spring), box-shadow .18s ease;
    box-shadow: 0 3px 0 rgba(0,0,0,.08), 0 5px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.8);
    white-space: nowrap;
  }
  .clay-pill:hover { transform: translateY(-2px); box-shadow: 0 5px 0 rgba(0,0,0,.1), 0 8px 20px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.8); }
  .clay-pill:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(0,0,0,.08), inset 0 2px 4px rgba(0,0,0,.08); }
  .clay-pill-on { background: var(--indigo) !important; color: white !important; box-shadow: 0 4px 0 rgba(99,102,241,.3), 0 6px 16px rgba(99,102,241,.25), inset 0 1px 0 rgba(255,255,255,.25) !important; }
  .clay-pill-on:hover { box-shadow: 0 6px 0 rgba(99,102,241,.35), 0 10px 24px rgba(99,102,241,.28), inset 0 1px 0 rgba(255,255,255,.25) !important; }

  /* ── CTA BUTTON ── */
  .clay-cta {
    border-radius: 999px !important; border: none !important;
    font-weight: 800 !important; font-family: 'Nunito', sans-serif !important;
    transition: transform .2s var(--spring), box-shadow .2s ease !important;
    color: white !important;
  }
  .clay-cta:hover { transform: translateY(-3px) !important; }
  .clay-cta:active { transform: translateY(3px) !important; box-shadow: 0 2px 0 rgba(0,0,0,.2), inset 0 2px 4px rgba(0,0,0,.1) !important; }

  /* ── SEC BUTTONS ── */
  .clay-btn-sec {
    border-radius: 999px !important;
    box-shadow: 0 3px 0 rgba(0,0,0,.08), 0 5px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #E0E7FF !important; background: white !important; font-weight: 700 !important;
    transition: transform .18s var(--spring), box-shadow .18s ease !important;
  }
  .clay-btn-sec:hover { transform: translateY(-2px) !important; box-shadow: 0 5px 0 rgba(0,0,0,.1), 0 8px 20px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.9) !important; }
  .clay-btn-sec:active { transform: translateY(2px) !important; }

  /* ── REFRESH BTN ── */
  .clay-refresh {
    border-radius: 999px !important;
    box-shadow: 0 4px 0 rgba(0,0,0,.1), 0 6px 16px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #C7D2FE !important; background: white !important;
    transition: transform .2s var(--spring), box-shadow .2s ease !important;
  }
  .clay-refresh:hover { transform: translateY(-2px) rotate(20deg) !important; }
  .clay-refresh:active { transform: translateY(2px) rotate(0deg) !important; }

  /* ── STAFF CARD ── */
  .clay-staff-card {
    border-radius: 24px;
    background: white;
    box-shadow: var(--clay-lg);
    transition: transform .22s var(--spring), box-shadow .22s ease;
    overflow: hidden;
    position: relative;
  }
  .clay-staff-card:hover {
    transform: translateY(-7px) rotate(0.4deg);
    box-shadow: 0 14px 0 rgba(0,0,0,.14), 0 28px 56px rgba(0,0,0,.13), inset 0 1px 0 rgba(255,255,255,.6);
  }
  .clay-staff-card:hover .staff-avatar { transform: scale(1.08) rotate(-6deg); }
  .clay-staff-card:hover .clay-ico { transform: rotate(-8deg) scale(1.12); }

  /* ── STAFF AVATAR ── */
  .staff-avatar {
    border-radius: 50%;
    box-shadow: 0 5px 0 rgba(0,0,0,.18), 0 8px 20px rgba(0,0,0,.14), inset 0 1px 0 rgba(255,255,255,.45);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: transform .25s var(--spring);
    font-family: 'Fraunces', serif !important; font-weight: 700;
  }

  /* ── ROLE BADGE ── */
  .clay-badge {
    border-radius: 999px;
    box-shadow: 0 2px 0 rgba(0,0,0,.07), inset 0 1px 0 rgba(255,255,255,.6);
    font-weight: 800; font-size: 11px; padding: 4px 10px;
    display: inline-flex; align-items: center; gap: 5px;
  }

  /* ── CARD DIVIDER ── */
  .clay-divider { border: none; border-top: 1px solid #EEF2FF; margin: 14px 0 12px; }

  /* ── CARD COLOUR STRIP ── */
  .card-strip {
    position: absolute; top: 0; left: 0; right: 0; height: 5px;
    border-radius: 24px 24px 0 0;
  }

  /* ── SHIMMER ── */
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .shimmer {
    background: linear-gradient(90deg, #EEF2FF 25%, #E0E7FF 50%, #EEF2FF 75%);
    background-size: 400px 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: 20px;
  }

  /* ── MODAL ── */
  .clay-overlay {
    position: fixed; inset: 0; z-index: 50;
    background: rgba(30,27,75,.45); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
    animation: fadeIn .2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .clay-modal {
    background: #FAFBFF; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
    border-radius: 28px;
    box-shadow: 0 24px 0 rgba(0,0,0,.12), 0 40px 80px rgba(0,0,0,.2);
    border: 2px solid rgba(255,255,255,.8);
    animation: modalIn .3s var(--spring);
  }
  @keyframes modalIn { from{opacity:0;transform:scale(.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }

  /* ── MODAL FIELD ── */
  .clay-field {
    border-radius: 14px !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.07), inset 0 -1px 0 rgba(255,255,255,.8) !important;
    border: 1.5px solid #C7D2FE !important;
    font-weight: 600 !important; background: #FAFBFF !important; font-family: 'Nunito', sans-serif !important;
    transition: border-color .2s, box-shadow .2s; width: 100%;
  }
  .clay-field:focus { border-color: var(--indigo) !important; box-shadow: inset 0 2px 6px rgba(0,0,0,.05), 0 0 0 3px rgba(99,102,241,.12) !important; outline: none !important; }

  /* ── INFO ROW ── */
  .clay-info {
    border-radius: 14px;
    background: linear-gradient(135deg, #F5F3FF, #EEF2FF);
    box-shadow: inset 0 2px 5px rgba(0,0,0,.06), inset 0 -1px 0 rgba(255,255,255,.7);
    border: 1px solid rgba(199,210,254,.5);
    padding: 13px 15px;
  }

  /* ── MODAL SAVE BTN ── */
  .clay-modal-save {
    border-radius: 999px !important; border: none !important;
    box-shadow: 0 5px 0 rgba(99,102,241,.35), 0 8px 20px rgba(99,102,241,.25), inset 0 1px 0 rgba(255,255,255,.3) !important;
    font-weight: 800 !important; font-family: 'Nunito', sans-serif !important;
    background: linear-gradient(135deg, #6366F1, #4F46E5) !important; color: white !important;
    transition: transform .2s var(--spring), box-shadow .2s ease !important; cursor: pointer;
  }
  .clay-modal-save:hover { transform: translateY(-3px) !important; }
  .clay-modal-save:active { transform: translateY(3px) !important; }
  .clay-modal-save:disabled { opacity: .6; transform: none !important; cursor: not-allowed; }

  /* ── MODAL CLOSE BTN ── */
  .clay-modal-close {
    border-radius: 999px !important; cursor: pointer;
    box-shadow: 0 3px 0 rgba(0,0,0,.08), 0 5px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #E0E7FF !important; background: white !important;
    font-weight: 700 !important; font-family: 'Nunito', sans-serif !important;
    transition: transform .18s var(--spring) !important;
  }
  .clay-modal-close:hover { transform: translateY(-2px) !important; }

  /* ── CLAY LABEL ── */
  .clay-label { font-size: 11px !important; font-weight: 800 !important; color: #4F46E5; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px; }

  /* ── DECORATIVE BLOBS ── */
  @keyframes blobFloat { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.07) rotate(4deg)} }
  .deco-blob { position: fixed; border-radius: 50%; pointer-events: none; animation: blobFloat 7s ease-in-out infinite; z-index: 0; }

  /* ── EMPTY STATE ── */
  .clay-empty { border-radius: 24px; background: white; box-shadow: var(--clay-md); padding: 56px 24px; text-align: center; }
  @keyframes emptyBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .clay-empty-ico { width: 68px; height: 68px; border-radius: 22px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; animation: emptyBounce 3s ease-in-out infinite; box-shadow: var(--clay-sm); }

  /* ── SPECIALIZATION TAG ── */
  .spec-tag {
    display: inline-flex; align-items: center; gap: 4px;
    border-radius: 999px; padding: 3px 9px; font-size: 11px; font-weight: 700;
    background: #EEF2FF; color: #4F46E5;
    box-shadow: 0 2px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.7);
    margin-top: 6px;
  }
`;

// ─── Role config ──────────────────────────────────────────────────────────────
const roleConfig: Record<string, {
    bg: string; color: string; stripColor: string;
    iconGrad: string; avatarGrad: string; statGrad: string;
    icon: LucideIcon; emoji: string; label: string;
}> = {
    doctor:       { bg: '#DBEAFE', color: '#1D4ED8', stripColor: '#3B82F6', iconGrad: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', avatarGrad: 'linear-gradient(135deg,#6366F1,#4F46E5)', statGrad: 'linear-gradient(135deg,#EEF2FF,#C7D2FE)', icon: Stethoscope, emoji: '🩺', label: 'Doctors' },
    receptionist: { bg: '#EDE9FE', color: '#6D28D9', stripColor: '#8B5CF6', iconGrad: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', avatarGrad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', statGrad: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', icon: Briefcase, emoji: '💼', label: 'Receptionists' },
    lab_tech:     { bg: '#FEF9C3', color: '#A16207', stripColor: '#F59E0B', iconGrad: 'linear-gradient(135deg,#F59E0B,#D97706)', avatarGrad: 'linear-gradient(135deg,#F59E0B,#B45309)', statGrad: 'linear-gradient(135deg,#FFFBEB,#FDE68A)', icon: FlaskConical, emoji: '🧪', label: 'Lab Techs' },
    pharmacist:   { bg: '#CFFAFE', color: '#0E7490', stripColor: '#06B6D4', iconGrad: 'linear-gradient(135deg,#06B6D4,#0284C7)', avatarGrad: 'linear-gradient(135deg,#06B6D4,#0369A1)', statGrad: 'linear-gradient(135deg,#ECFEFF,#A5F3FC)', icon: Pill, emoji: '💊', label: 'Pharmacists' },
    supplier:     { bg: '#FFEDD5', color: '#C2410C', stripColor: '#F97316', iconGrad: 'linear-gradient(135deg,#F97316,#EA580C)', avatarGrad: 'linear-gradient(135deg,#F97316,#C2410C)', statGrad: 'linear-gradient(135deg,#FFF7ED,#FED7AA)', icon: Package, emoji: '📦', label: 'Suppliers' },
};
const getRole = (r: string) => roleConfig[r] || { bg: '#F1F5F9', color: '#475569', stripColor: '#94A3B8', iconGrad: 'linear-gradient(135deg,#94A3B8,#64748B)', avatarGrad: 'linear-gradient(135deg,#94A3B8,#475569)', statGrad: 'linear-gradient(135deg,#F1F5F9,#E2E8F0)', icon: User, emoji: '👤', label: 'Staff' };

const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); });

interface StaffMember {
    id: string; user_id: string; specialization?: string;
    license_number?: string; department?: string;
    profile: { full_name: string; email: string; phone?: string };
    role: string;
}

const fieldStyle: React.CSSProperties = {
    borderRadius: 14, border: '1.5px solid #C7D2FE',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,.07), inset 0 -1px 0 rgba(255,255,255,.8)',
    background: '#FAFBFF', fontWeight: 600, fontFamily: 'Nunito,sans-serif',
    padding: '9px 14px', width: '100%', fontSize: 14, color: '#1E1B4B',
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function StaffPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [viewStaff, setViewStaff] = useState<StaffMember | null>(null);
    const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editForm, setEditForm] = useState({ full_name: '', phone: '', role: '', specialization: '', license_number: '' });
    const [addForm, setAddForm] = useState({ email: '', password: '', full_name: '', phone: '', role: 'doctor', specialization: '', license_number: '' });

    const { data: staff, error, isLoading, mutate } = useSWR<StaffMember[]>('/api/admin/staff', fetcher);

    const filteredStaff = staff?.filter(m => {
        const ms = m.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.specialization?.toLowerCase().includes(searchQuery.toLowerCase());
        const md = departmentFilter === 'all' || m.role === departmentFilter;
        return ms && md;
    }) || [];

    const handleEdit = (m: StaffMember) => {
        setEditStaff(m);
        setEditForm({ full_name: m.profile?.full_name || '', phone: m.profile?.phone || '', role: m.role || '', specialization: m.specialization || '', license_number: m.license_number || '' });
    };

    const handleSaveEdit = async () => {
        if (!editStaff) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/staff/${editStaff.user_id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error('Failed');
            await mutate(); setEditStaff(null);
        } catch { alert('Failed to update staff member.'); }
        finally { setIsSaving(false); }
    };

    const handleAddStaff = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/staff', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
            await mutate(); setShowAddModal(false);
            setAddForm({ email: '', password: '', full_name: '', phone: '', role: 'doctor', specialization: '', license_number: '' });
        } catch (e) { alert(e instanceof Error ? e.message : 'Failed to add staff member.'); }
        finally { setIsSaving(false); }
    };

    if (error) return (
        <>
            <style dangerouslySetInnerHTML={{ __html: clayCSS }} />
            <div className="clay-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, background: 'var(--bg)' }}>
                <div style={{ borderRadius: 24, padding: '40px 48px', background: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)', boxShadow: 'var(--clay-md)', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Error loading staff</p>
                    <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 6 }}>Please try refreshing the page</p>
                </div>
            </div>
        </>
    );

    const statRoles = ['doctor', 'receptionist', 'lab_tech', 'pharmacist'];
    const filterRoles = ['all', 'doctor', 'receptionist', 'lab_tech', 'pharmacist', 'supplier'];

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: clayCSS }} />

            <div className="clay-page" style={{ background: 'var(--bg)', minHeight: '100vh', padding: '0 0 56px', position: 'relative' }}>

                {/* Decorative blobs */}
                <div className="deco-blob" style={{ width: 400, height: 400, background: 'radial-gradient(circle,rgba(99,102,241,.07),transparent 70%)', top: -100, right: -80 }} />
                <div className="deco-blob" style={{ width: 280, height: 280, background: 'radial-gradient(circle,rgba(16,185,129,.06),transparent 70%)', bottom: 180, left: -60, animationDelay: '3.5s' }} />
                <div className="deco-blob" style={{ width: 200, height: 200, background: 'radial-gradient(circle,rgba(245,158,11,.05),transparent 70%)', top: '35%', left: '40%', animationDelay: '6s' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>

                    {/* ── PAGE HEADER ── */}
                    <div style={{ padding: '32px 0 26px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="clay-ico" style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: 'white' }}>
                                <Stethoscope size={22} />
                            </div>
                            <div>
                                <h1 style={{ fontFamily: 'Fraunces,serif', fontSize: 30, fontWeight: 700, color: '#1E1B4B', lineHeight: 1 }}>Staff Management</h1>
                                <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 3 }}>Manage doctors, nurses, and other staff members</p>
                            </div>
                        </div>
                        <button className="clay-cta" onClick={() => setShowAddModal(true)}
                            style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 5px 0 rgba(16,185,129,.35),0 8px 20px rgba(16,185,129,.25),inset 0 1px 0 rgba(255,255,255,.3)', padding: '12px 24px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <UserPlus size={16} /> Add Staff Member
                        </button>
                    </div>

                    {/* ── STAT CARDS ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: 12, marginBottom: 22 }}>
                        {statRoles.map(role => {
                            const rc = getRole(role);
                            const count = staff?.filter(s => s.role === role).length || 0;
                            const Icon = rc.icon;
                            return (
                                <div key={role} className="clay-stat" style={{ background: rc.statGrad, padding: '18px 20px' }}>
                                    <div className="stat-blob" style={{ width: 80, height: 80, bottom: -22, right: -22 }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                                        <div>
                                            <p style={{ fontSize: 10, fontWeight: 800, color: rc.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>{rc.label}</p>
                                            <p style={{ fontFamily: 'Fraunces,serif', fontSize: 38, fontWeight: 700, color: '#1E1B4B', lineHeight: 1 }}>{count}</p>
                                        </div>
                                        <div className="clay-ico" style={{ width: 42, height: 42, background: rc.iconGrad, color: 'white' }}>
                                            <Icon size={19} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── FILTER BAR ── */}
                    <div className="clay-card" style={{ padding: '18px 20px', marginBottom: 22 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <Search size={15} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#9090B0', pointerEvents: 'none' }} />
                                <input className="clay-search"
                                    placeholder="Search by name, email, or specialization…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px 10px 42px', fontSize: 14, color: '#1E1B4B' }}
                                />
                            </div>
                            {/* Role pills */}
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                                {filterRoles.map(r => {
                                    const rc = getRole(r);
                                    const active = departmentFilter === r;
                                    const Icon = rc.icon;
                                    return (
                                        <button key={r}
                                            className={`clay-pill ${active ? 'clay-pill-on' : ''}`}
                                            onClick={() => setDepartmentFilter(r)}
                                            style={{
                                                padding: '6px 14px', fontSize: 12,
                                                background: active ? undefined : (r === 'all' ? 'white' : rc.bg),
                                                color: active ? undefined : (r === 'all' ? '#4C4C72' : rc.color),
                                                display: 'flex', alignItems: 'center', gap: 5,
                                            }}>
                                            {r !== 'all' && <Icon size={11} />}
                                            {r === 'all' ? '✦ All' : rc.label}
                                        </button>
                                    );
                                })}
                                <button className="clay-refresh" onClick={() => mutate()}
                                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6366F1', marginLeft: 'auto' }}>
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── STAFF GRID ── */}
                    {isLoading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="shimmer" style={{ height: 220 }} />
                            ))}
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="clay-empty">
                            <div className="clay-empty-ico" style={{ background: 'linear-gradient(135deg,#EEF2FF,#C7D2FE)' }}>
                                <Stethoscope size={28} style={{ color: '#6366F1' }} />
                            </div>
                            <p style={{ fontFamily: 'Fraunces,serif', fontSize: 18, fontWeight: 700, color: '#1E1B4B' }}>No staff members found</p>
                            <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 6 }}>Try adjusting your search or filter</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                            {filteredStaff.map(member => {
                                const rc = getRole(member.role);
                                const Icon = rc.icon;
                                const initial = member.profile?.full_name?.[0]?.toUpperCase() || '?';
                                return (
                                    <div key={member.id} className="clay-staff-card">
                                        {/* Colour accent strip */}
                                        <div className="card-strip" style={{ background: rc.iconGrad }} />

                                        <div style={{ padding: '22px 20px 16px' }}>
                                            {/* Avatar + name row */}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                                <div className="staff-avatar" style={{ width: 60, height: 60, background: rc.avatarGrad, color: 'white', fontSize: 24 }}>
                                                    {initial}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontFamily: 'Fraunces,serif', fontSize: 16, fontWeight: 700, color: '#1E1B4B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.profile?.full_name || 'Unknown'}</p>
                                                    <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.profile?.email}</p>
                                                    <span className="clay-badge" style={{ background: rc.bg, color: rc.color, marginTop: 7 }}>
                                                        <Icon size={11} /> {member.role?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                {/* Role icon bubble top-right */}
                                                <div className="clay-ico" style={{ width: 36, height: 36, background: rc.iconGrad, color: 'white', flexShrink: 0 }}>
                                                    <Icon size={16} />
                                                </div>
                                            </div>

                                            {/* Spec / license tags */}
                                            {(member.specialization || member.license_number) && (
                                                <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {member.specialization && (
                                                        <span className="spec-tag">🔬 {member.specialization}</span>
                                                    )}
                                                    {member.license_number && (
                                                        <span className="spec-tag" style={{ background: '#ECFDF5', color: '#15803D' }}>🪪 {member.license_number}</span>
                                                    )}
                                                </div>
                                            )}

                                            <hr className="clay-divider" />

                                            {/* Action buttons */}
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="clay-btn-sec" onClick={() => setViewStaff(member)}
                                                    style={{ flex: 1, padding: '8px 0', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#4C4C72' }}>
                                                    <Eye size={13} /> View
                                                </button>
                                                <button className="clay-btn-sec" onClick={() => handleEdit(member)}
                                                    style={{ flex: 1, padding: '8px 0', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: '#4C4C72' }}>
                                                    <Pencil size={13} /> Edit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── VIEW MODAL ── */}
            {viewStaff && (() => {
                const rc = getRole(viewStaff.role);
                const Icon = rc.icon;
                const initial = viewStaff.profile?.full_name?.[0]?.toUpperCase() || '?';
                return (
                    <div className="clay-overlay" onClick={() => setViewStaff(null)}>
                        <div className="clay-modal" onClick={e => e.stopPropagation()}>
                            {/* Gradient header */}
                            <div style={{ background: rc.iconGrad, padding: '24px 24px 20px', borderRadius: '26px 26px 0 0', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -30, right: -30, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
                                <div style={{ position: 'absolute', bottom: -20, left: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontFamily: 'Fraunces,serif', fontWeight: 700, color: 'white', boxShadow: '0 4px 0 rgba(0,0,0,.1),0 8px 20px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.4)', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
                                        {initial}
                                    </div>
                                    <div>
                                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1 }}>{viewStaff.profile?.full_name}</p>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.22)', color: 'white', borderRadius: 999, padding: '4px 11px', fontSize: 11, fontWeight: 800, marginTop: 7, backdropFilter: 'blur(4px)', boxShadow: '0 2px 0 rgba(0,0,0,.07)' }}>
                                            <Icon size={11} /> {viewStaff.role?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                                {[
                                    { label: 'Full Name', value: viewStaff.profile?.full_name || 'N/A' },
                                    { label: 'Email Address', value: viewStaff.profile?.email || 'N/A' },
                                    { label: 'Phone', value: viewStaff.profile?.phone || 'N/A' },
                                    ...(viewStaff.specialization ? [{ label: 'Specialization', value: viewStaff.specialization }] : []),
                                    ...(viewStaff.license_number ? [{ label: 'License Number', value: viewStaff.license_number }] : []),
                                    { label: 'User ID', value: viewStaff.user_id, mono: true },
                                ].map(row => (
                                    <div key={row.label} className="clay-info">
                                        <span className="clay-label">{row.label}</span>
                                        <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14, fontFamily: (row as any).mono ? 'monospace' : 'Nunito,sans-serif', wordBreak: 'break-all' }}>{row.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '12px 22px 22px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="clay-modal-close" onClick={() => setViewStaff(null)} style={{ padding: '10px 26px', fontSize: 14, color: '#4C4C72' }}>Close</button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── EDIT MODAL ── */}
            {editStaff && (
                <div className="clay-overlay" onClick={() => setEditStaff(null)}>
                    <div className="clay-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #EEF2FF', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="clay-ico" style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: 'white' }}>
                                <Pencil size={17} />
                            </div>
                            <div>
                                <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Edit Staff Member</p>
                                <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600 }}>{editStaff.profile?.email}</p>
                            </div>
                        </div>
                        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Enter full name' },
                                { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: 'Enter phone number' },
                            ].map(f => (
                                <div key={f.key}>
                                    <span className="clay-label">{f.label}</span>
                                    <input type={f.type} value={(editForm as any)[f.key]} placeholder={f.placeholder}
                                        onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                                        className="clay-field" style={{ ...fieldStyle }} />
                                </div>
                            ))}
                            <div>
                                <span className="clay-label">Role</span>
                                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    className="clay-field" style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}>
                                    {['doctor', 'receptionist', 'lab_tech', 'pharmacist', 'supplier'].map(r => (
                                        <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                    ))}
                                </select>
                            </div>
                            {editForm.role === 'doctor' && (
                                <>
                                    <div>
                                        <span className="clay-label">Specialization</span>
                                        <input value={editForm.specialization} placeholder="e.g., Cardiology"
                                            onChange={e => setEditForm({ ...editForm, specialization: e.target.value })}
                                            className="clay-field" style={{ ...fieldStyle }} />
                                    </div>
                                    <div>
                                        <span className="clay-label">License Number</span>
                                        <input value={editForm.license_number} placeholder="Enter license number"
                                            onChange={e => setEditForm({ ...editForm, license_number: e.target.value })}
                                            className="clay-field" style={{ ...fieldStyle }} />
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ padding: '12px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="clay-modal-close" onClick={() => setEditStaff(null)} disabled={isSaving} style={{ padding: '10px 22px', fontSize: 14, color: '#4C4C72' }}>Cancel</button>
                            <button className="clay-modal-save" onClick={handleSaveEdit} disabled={isSaving} style={{ padding: '10px 26px', fontSize: 14 }}>
                                {isSaving ? '⏳ Saving…' : '💾 Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ADD STAFF MODAL ── */}
            {showAddModal && (
                <div className="clay-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="clay-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #EEF2FF', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="clay-ico" style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white' }}>
                                <UserPlus size={17} />
                            </div>
                            <div>
                                <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Add New Staff Member</p>
                                <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600 }}>Fill in all required fields</p>
                            </div>
                        </div>
                        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { label: 'Email Address *', key: 'email', type: 'email', placeholder: 'Enter email address' },
                                { label: 'Password *', key: 'password', type: 'password', placeholder: 'Enter password' },
                                { label: 'Full Name *', key: 'full_name', type: 'text', placeholder: 'Enter full name' },
                                { label: 'Phone', key: 'phone', type: 'tel', placeholder: 'Enter phone number' },
                            ].map(f => (
                                <div key={f.key}>
                                    <span className="clay-label">{f.label}</span>
                                    <input type={f.type} value={(addForm as any)[f.key]} placeholder={f.placeholder}
                                        onChange={e => setAddForm({ ...addForm, [f.key]: e.target.value })}
                                        className="clay-field" style={{ ...fieldStyle }} />
                                </div>
                            ))}
                            <div>
                                <span className="clay-label">Role *</span>
                                <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                                    className="clay-field" style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}>
                                    {['doctor', 'receptionist', 'lab_tech', 'pharmacist', 'supplier'].map(r => (
                                        <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                    ))}
                                </select>
                            </div>
                            {addForm.role === 'doctor' && (
                                <>
                                    <div>
                                        <span className="clay-label">Specialization</span>
                                        <input value={addForm.specialization} placeholder="e.g., Cardiology"
                                            onChange={e => setAddForm({ ...addForm, specialization: e.target.value })}
                                            className="clay-field" style={{ ...fieldStyle }} />
                                    </div>
                                    <div>
                                        <span className="clay-label">License Number</span>
                                        <input value={addForm.license_number} placeholder="Enter license number"
                                            onChange={e => setAddForm({ ...addForm, license_number: e.target.value })}
                                            className="clay-field" style={{ ...fieldStyle }} />
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ padding: '12px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="clay-modal-close" onClick={() => setShowAddModal(false)} disabled={isSaving} style={{ padding: '10px 22px', fontSize: 14, color: '#4C4C72' }}>Cancel</button>
                            <button className="clay-modal-save" onClick={handleAddStaff} disabled={isSaving}
                                style={{ padding: '10px 26px', fontSize: 14, background: 'linear-gradient(135deg,#10B981,#059669) !important', boxShadow: '0 5px 0 rgba(16,185,129,.35),0 8px 20px rgba(16,185,129,.25),inset 0 1px 0 rgba(255,255,255,.3) !important' }}>
                                {isSaving ? '⏳ Adding…' : '✅ Add Staff Member'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}