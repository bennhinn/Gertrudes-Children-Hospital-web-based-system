'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { Users, Search, RefreshCw, Eye, Pencil, ShieldCheck, Stethoscope, Heart, ClipboardList, FlaskConical, Pill, Truck, HelpCircle } from 'lucide-react';

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

  .clay-page * { font-family:'Nunito',sans-serif !important; box-sizing:border-box; }
  .clay-page::before {
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    opacity:.35;
  }

  /* ── CLAY SURFACE ── */
  .clay-card {
    border-radius:24px !important; border:none !important;
    box-shadow:var(--clay-md) !important; background:white; overflow:hidden;
  }

  /* ── ICON BUBBLE ── */
  .clay-ico {
    border-radius:16px;
    box-shadow:0 4px 0 rgba(0,0,0,.15),0 8px 16px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.5);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    transition:transform .22s var(--spring);
  }

  /* ── SEARCH INPUT ── */
  .clay-search {
    border-radius:999px !important;
    box-shadow:inset 0 2px 6px rgba(0,0,0,.07),inset 0 -1px 0 rgba(255,255,255,.8) !important;
    border:1.5px solid #C7D2FE !important;
    font-weight:600 !important; background:#FAFBFF !important;
    transition:border-color .2s,box-shadow .2s;
  }
  .clay-search:focus {
    border-color:var(--indigo) !important;
    box-shadow:inset 0 2px 6px rgba(0,0,0,.05),0 0 0 3px rgba(99,102,241,.12) !important;
    outline:none !important;
  }

  /* ── ROLE FILTER PILLS ── */
  .clay-pill {
    border-radius:999px; border:none; cursor:pointer;
    font-weight:700; font-family:'Nunito',sans-serif;
    transition:transform .18s var(--spring),box-shadow .18s ease;
    box-shadow:0 3px 0 rgba(0,0,0,.08),0 5px 12px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.8);
    white-space:nowrap;
  }
  .clay-pill:hover { transform:translateY(-2px); box-shadow:0 5px 0 rgba(0,0,0,.1),0 8px 20px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.8); }
  .clay-pill:active { transform:translateY(2px); box-shadow:0 1px 0 rgba(0,0,0,.08),inset 0 2px 4px rgba(0,0,0,.08); }
  .clay-pill-on { background:var(--indigo)!important; color:white!important; box-shadow:0 4px 0 rgba(99,102,241,.3),0 6px 16px rgba(99,102,241,.25),inset 0 1px 0 rgba(255,255,255,.25)!important; }
  .clay-pill-on:hover { box-shadow:0 6px 0 rgba(99,102,241,.35),0 10px 24px rgba(99,102,241,.28),inset 0 1px 0 rgba(255,255,255,.25)!important; }

  /* ── REFRESH BTN ── */
  .clay-refresh {
    border-radius:999px!important;
    box-shadow:0 4px 0 rgba(0,0,0,.1),0 6px 16px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.9)!important;
    border:1.5px solid #C7D2FE!important; background:white!important;
    transition:transform .2s var(--spring),box-shadow .2s ease!important;
  }
  .clay-refresh:hover { transform:translateY(-2px) rotate(15deg)!important; box-shadow:0 6px 0 rgba(0,0,0,.1),0 10px 24px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.9)!important; }
  .clay-refresh:active { transform:translateY(2px) rotate(0deg)!important; box-shadow:var(--clay-pressed)!important; }

  /* ── USER ROW (mobile + desktop) ── */
  .clay-user-row {
    border-radius:18px;
    background:linear-gradient(135deg,#FAFBFF,#F0F4FF);
    box-shadow:0 2px 0 rgba(0,0,0,.05),0 4px 14px rgba(0,0,0,.05),inset 0 1px 0 rgba(255,255,255,.9);
    transition:transform .18s var(--spring),box-shadow .18s ease;
    margin-bottom:9px;
  }
  .clay-user-row:hover {
    transform:translateX(5px) scale(1.005);
    box-shadow:0 4px 0 rgba(0,0,0,.07),0 8px 22px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.9);
  }
  .clay-user-row:hover .clay-avatar { transform:scale(1.12) rotate(-6deg); }

  /* ── USER AVATAR ── */
  .clay-avatar {
    border-radius:50%;
    box-shadow:0 4px 0 rgba(99,102,241,.25),0 6px 16px rgba(99,102,241,.15),inset 0 1px 0 rgba(255,255,255,.4);
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
    transition:transform .22s var(--spring);
    font-family:'Fraunces',serif!important; font-weight:700;
  }

  /* ── STATUS / ROLE BADGE ── */
  .clay-badge {
    border-radius:999px;
    box-shadow:0 2px 0 rgba(0,0,0,.07),inset 0 1px 0 rgba(255,255,255,.6);
    font-weight:800; font-size:11px; padding:3px 10px;
    display:inline-flex; align-items:center; gap:5px;
  }

  /* ── TABLE HEAD ── */
  .clay-thead { background:linear-gradient(135deg,#EEF2FF,#E0E7FF); }
  .clay-thead th { color:#4F46E5!important; font-weight:800!important; font-size:11px!important; text-transform:uppercase!important; letter-spacing:1px!important; }

  /* ── SEC BUTTONS ── */
  .clay-btn-sec {
    border-radius:999px!important;
    box-shadow:0 3px 0 rgba(0,0,0,.08),0 5px 12px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.9)!important;
    border:1.5px solid #E0E7FF!important; background:white!important;
    font-weight:700!important;
    transition:transform .18s var(--spring),box-shadow .18s ease!important;
  }
  .clay-btn-sec:hover { transform:translateY(-2px)!important; box-shadow:0 5px 0 rgba(0,0,0,.1),0 8px 20px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.9)!important; }
  .clay-btn-sec:active { transform:translateY(2px)!important; }

  /* ── SHIMMER ── */
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .shimmer {
    background:linear-gradient(90deg,#EEF2FF 25%,#E0E7FF 50%,#EEF2FF 75%);
    background-size:400px 100%; animation:shimmer 1.4s ease-in-out infinite; border-radius:16px;
  }

  /* ── MODAL OVERLAY ── */
  .clay-overlay {
    position:fixed; inset:0; z-index:50;
    background:rgba(30,27,75,.45); backdrop-filter:blur(10px);
    display:flex; align-items:center; justify-content:center; padding:16px;
    animation:fadeIn .2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  /* ── MODAL BOX ── */
  .clay-modal {
    background:#FAFBFF; width:100%; max-width:460px; max-height:90vh; overflow-y:auto;
    border-radius:28px;
    box-shadow:0 24px 0 rgba(0,0,0,.12),0 40px 80px rgba(0,0,0,.2);
    border:2px solid rgba(255,255,255,.8);
    animation:modalIn .3s var(--spring);
  }
  @keyframes modalIn { from{opacity:0;transform:scale(.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }

  /* ── MODAL FIELD ── */
  .clay-field {
    border-radius:14px!important;
    box-shadow:inset 0 2px 6px rgba(0,0,0,.07),inset 0 -1px 0 rgba(255,255,255,.8)!important;
    border:1.5px solid #C7D2FE!important;
    font-weight:600!important; background:#FAFBFF!important; font-family:'Nunito',sans-serif!important;
    transition:border-color .2s,box-shadow .2s;
  }
  .clay-field:focus { border-color:var(--indigo)!important; box-shadow:inset 0 2px 6px rgba(0,0,0,.05),0 0 0 3px rgba(99,102,241,.12)!important; outline:none!important; }

  /* ── MODAL INFO ROW ── */
  .clay-info {
    border-radius:14px;
    background:linear-gradient(135deg,#F5F3FF,#EEF2FF);
    box-shadow:inset 0 2px 5px rgba(0,0,0,.06),inset 0 -1px 0 rgba(255,255,255,.7);
    border:1px solid rgba(199,210,254,.5);
    padding:13px 15px;
  }

  /* ── MODAL PRIMARY BTN ── */
  .clay-modal-save {
    border-radius:999px!important; border:none!important;
    box-shadow:0 5px 0 rgba(99,102,241,.35),0 8px 20px rgba(99,102,241,.25),inset 0 1px 0 rgba(255,255,255,.3)!important;
    font-weight:800!important; font-family:'Nunito',sans-serif!important;
    background:linear-gradient(135deg,#6366F1,#4F46E5)!important; color:white!important;
    transition:transform .2s var(--spring),box-shadow .2s ease!important; cursor:pointer;
  }
  .clay-modal-save:hover { transform:translateY(-3px)!important; box-shadow:0 8px 0 rgba(99,102,241,.4),0 14px 32px rgba(99,102,241,.3),inset 0 1px 0 rgba(255,255,255,.3)!important; }
  .clay-modal-save:active { transform:translateY(3px)!important; }
  .clay-modal-save:disabled { opacity:.6; transform:none!important; cursor:not-allowed; }

  /* ── MODAL CLOSE BTN ── */
  .clay-modal-close {
    border-radius:999px!important; cursor:pointer;
    box-shadow:0 3px 0 rgba(0,0,0,.08),0 5px 12px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.9)!important;
    border:1.5px solid #E0E7FF!important; background:white!important;
    font-weight:700!important; font-family:'Nunito',sans-serif!important;
    transition:transform .18s var(--spring)!important;
  }
  .clay-modal-close:hover { transform:translateY(-2px)!important; }
  .clay-modal-close:active { transform:translateY(2px)!important; }

  /* ── CLAY LABEL ── */
  .clay-label { font-size:11px!important; font-weight:800!important; color:#4F46E5; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:6px; }

  /* ── MODAL AVATAR (large) ── */
  .clay-avatar-lg {
    border-radius:50%;
    box-shadow:0 8px 0 rgba(99,102,241,.25),0 12px 32px rgba(99,102,241,.2),inset 0 2px 0 rgba(255,255,255,.5);
    display:flex; align-items:center; justify-content:center;
    font-family:'Fraunces',serif!important; font-weight:700;
  }

  /* ── DECORATIVE BLOBS ── */
  @keyframes blobFloat { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.07) rotate(5deg)} }
  .deco-blob { position:fixed; border-radius:50%; pointer-events:none; animation:blobFloat 7s ease-in-out infinite; z-index:0; }

  /* ── EMPTY STATE ── */
  .clay-empty-ico {
    width:68px; height:68px; border-radius:22px;
    background:linear-gradient(135deg,#EEF2FF,#C7D2FE);
    box-shadow:var(--clay-sm);
    display:flex; align-items:center; justify-content:center; margin:0 auto 14px;
    animation:blobFloat 4s ease-in-out infinite;
  }
`;

// ─── Role config ──────────────────────────────────────────────────────────────
const roleConfig: Record<string, { bg: string; color: string; iconGrad: string; avatarGrad: string; icon: React.ReactNode }> = {
    admin:        { bg: '#FFE4E6', color: '#BE123C', iconGrad: 'linear-gradient(135deg,#F43F5E,#E11D48)', avatarGrad: 'linear-gradient(135deg,#F43F5E,#C2410C)', icon: <ShieldCheck size={12} /> },
    doctor:       { bg: '#DBEAFE', color: '#1D4ED8', iconGrad: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', avatarGrad: 'linear-gradient(135deg,#6366F1,#4F46E5)', icon: <Stethoscope size={12} /> },
    caregiver:    { bg: '#DCFCE7', color: '#15803D', iconGrad: 'linear-gradient(135deg,#10B981,#059669)', avatarGrad: 'linear-gradient(135deg,#10B981,#059669)', icon: <Heart size={12} /> },
    receptionist: { bg: '#EDE9FE', color: '#6D28D9', iconGrad: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', avatarGrad: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', icon: <ClipboardList size={12} /> },
    lab_tech:     { bg: '#FEF9C3', color: '#A16207', iconGrad: 'linear-gradient(135deg,#F59E0B,#D97706)', avatarGrad: 'linear-gradient(135deg,#F59E0B,#B45309)', icon: <FlaskConical size={12} /> },
    pharmacist:   { bg: '#CFFAFE', color: '#0E7490', iconGrad: 'linear-gradient(135deg,#06B6D4,#0284C7)', avatarGrad: 'linear-gradient(135deg,#06B6D4,#0369A1)', icon: <Pill size={12} /> },
    supplier:     { bg: '#FFEDD5', color: '#C2410C', iconGrad: 'linear-gradient(135deg,#F97316,#EA580C)', avatarGrad: 'linear-gradient(135deg,#F97316,#C2410C)', icon: <Truck size={12} /> },
};
const getRole = (r: string) => roleConfig[r] || { bg: '#F1F5F9', color: '#475569', iconGrad: 'linear-gradient(135deg,#94A3B8,#64748B)', avatarGrad: 'linear-gradient(135deg,#94A3B8,#475569)', icon: <HelpCircle size={12} /> };

const fetcher = (url: string) => fetch(url).then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); });

interface User { id: string; email: string; full_name: string; role: string; created_at: string; phone?: string; }

const USERS_PER_PAGE = 10;

// ─── Shared field style ───────────────────────────────────────────────────────
const fieldStyle: React.CSSProperties = {
    borderRadius: 14, border: '1.5px solid #C7D2FE',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,.07),inset 0 -1px 0 rgba(255,255,255,.8)',
    background: '#FAFBFF', fontWeight: 600, fontFamily: 'Nunito,sans-serif',
    padding: '9px 14px', width: '100%', fontSize: 14, color: '#1E1B4B',
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', role: '' });
    const [isSaving, setIsSaving] = useState(false);

    const { data: users, error, isLoading, mutate } = useSWR<User[]>('/api/admin/users', fetcher);

    const filteredUsers = users?.filter(u => {
        const ms = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const mr = roleFilter === 'all' || u.role === roleFilter;
        return ms && mr;
    }) || [];

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * USERS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, roleFilter]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handleEdit = (user: User) => {
        setEditUser(user);
        setEditForm({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '', role: user.role || '' });
    };

    const handleSaveEdit = async () => {
        if (!editUser) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${editUser.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error('Failed to update');
            await mutate(); setEditUser(null);
        } catch { alert('Failed to update user. Please try again.'); }
        finally { setIsSaving(false); }
    };

    if (error) return (
        <>
            <style dangerouslySetInnerHTML={{ __html: clayCSS }} />
            <div className="clay-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, background: 'var(--bg)' }}>
                <div style={{ borderRadius: 24, padding: '40px 48px', background: 'linear-gradient(135deg,#FFF1F2,#FFE4E6)', boxShadow: 'var(--clay-md)', textAlign: 'center' }}>
                    <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Error loading users</p>
                    <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 6 }}>Please try refreshing the page</p>
                </div>
            </div>
        </>
    );

    const roles = ['all', 'admin', 'doctor', 'caregiver', 'receptionist', 'lab_tech', 'pharmacist', 'supplier'];
    const roleLabel = (r: string) => r === 'all' ? '✦ All' : r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: clayCSS }} />

            <div className="clay-page" style={{ background: 'var(--bg)', minHeight: '100vh', padding: '0 0 56px', position: 'relative' }}>

                {/* Decorative blobs */}
                <div className="deco-blob" style={{ width: 380, height: 380, background: 'radial-gradient(circle,rgba(99,102,241,.07),transparent 70%)', top: -100, right: -80 }} />
                <div className="deco-blob" style={{ width: 260, height: 260, background: 'radial-gradient(circle,rgba(139,92,246,.06),transparent 70%)', bottom: 200, left: -60, animationDelay: '3s' }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>

                    {/* ── PAGE HEADER ── */}
                    <div style={{ padding: '32px 0 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="clay-ico" style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: 'white' }}>
                                <Users size={22} />
                            </div>
                            <div>
                                <h1 style={{ fontFamily: 'Fraunces,serif', fontSize: 30, fontWeight: 700, color: '#1E1B4B', lineHeight: 1 }}>User Management</h1>
                                <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 3 }}>View and manage all system users</p>
                            </div>
                        </div>
                        {/* user count chip */}
                        <div style={{ background: 'white', borderRadius: 999, padding: '8px 18px', boxShadow: '0 3px 0 rgba(0,0,0,.07),0 5px 14px rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#1E1B4B' }}>{users?.length ?? 0} total users</span>
                        </div>
                    </div>

                    {/* ── FILTER BAR ── */}
                    <div className="clay-card" style={{ padding: '18px 20px', marginBottom: 18 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <Search size={15} style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: '#9090B0', pointerEvents: 'none' }} />
                                <input className="clay-search"
                                    placeholder="Search by name or email…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px 10px 42px', fontSize: 14, color: '#1E1B4B' }}
                                />
                            </div>
                            {/* Role pills */}
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
                                {roles.map(r => {
                                    const rc = getRole(r);
                                    const active = roleFilter === r;
                                    return (
                                        <button key={r}
                                            className={`clay-pill ${active ? 'clay-pill-on' : ''}`}
                                            onClick={() => setRoleFilter(r)}
                                            style={{
                                                padding: '6px 14px', fontSize: 12,
                                                background: active ? undefined : (r === 'all' ? 'white' : rc.bg),
                                                color: active ? undefined : (r === 'all' ? '#4C4C72' : rc.color),
                                                display: 'flex', alignItems: 'center', gap: 5,
                                            }}>
                                            {r !== 'all' && <span style={{ opacity: .85 }}>{rc.icon}</span>}
                                            {roleLabel(r)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── USERS TABLE ── */}
                    <div className="clay-card">
                        {/* Panel header */}
                        <div style={{ padding: '18px 22px 16px', borderBottom: '1px solid #EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Users</p>
                                <span style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: 999, padding: '3px 11px', fontSize: 12, fontWeight: 800, boxShadow: '0 2px 0 rgba(0,0,0,.06),inset 0 1px 0 rgba(255,255,255,.8)' }}>
                                    {filteredUsers.length}
                                </span>
                            </div>
                            <button className="clay-refresh" onClick={() => mutate()}
                                style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6366F1' }}>
                                <RefreshCw size={15} />
                            </button>
                        </div>

                        <div style={{ padding: '16px' }}>
                            {isLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {[...Array(6)].map((_, i) => <div key={i} className="shimmer" style={{ height: 68 }} />)}
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                    <div className="clay-empty-ico">
                                        <Users size={28} style={{ color: '#6366F1' }} />
                                    </div>
                                    <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 16 }}>No users found</p>
                                    <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 5 }}>Try adjusting your search or filter</p>
                                </div>
                            ) : (
                                <div>
                                    {paginatedUsers.map((user) => {
                                        const rc = getRole(user.role);
                                        const initial = user.full_name?.[0]?.toUpperCase() || '?';
                                        return (
                                            <div key={user.id} className="clay-user-row" style={{ padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 13 }}>

                                                {/* Avatar */}
                                                <div className="clay-avatar" style={{ width: 44, height: 44, background: rc.avatarGrad, color: 'white', fontSize: 19 }}>
                                                    {initial}
                                                </div>

                                                {/* Name + email */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name || 'Unknown'}</p>
                                                    <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                                                </div>

                                                {/* Role badge – hidden on small screens, shown on md+ */}
                                                <span className="clay-badge" style={{ background: rc.bg, color: rc.color, flexShrink: 0, display: 'none' }}
                                                    data-role-badge>
                                                    {rc.icon} {user.role?.replace('_', ' ')}
                                                </span>

                                                {/* Joined */}
                                                <span style={{ fontSize: 11, color: '#9090B0', fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap' }}>
                                                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                </span>

                                                {/* Role badge (always visible) */}
                                                <span className="clay-badge" style={{ background: rc.bg, color: rc.color, flexShrink: 0 }}>
                                                    {rc.icon} {user.role?.replace('_', ' ')}
                                                </span>

                                                {/* Actions */}
                                                <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                                                    <button className="clay-btn-sec" onClick={() => setViewUser(user)}
                                                        style={{ padding: '6px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#4C4C72' }}>
                                                        <Eye size={13} /> View
                                                    </button>
                                                    <button className="clay-btn-sec" onClick={() => handleEdit(user)}
                                                        style={{ padding: '6px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#4C4C72' }}>
                                                        <Pencil size={13} /> Edit
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Pagination */}
                                    {filteredUsers.length > USERS_PER_PAGE && (
                                        <div style={{
                                            marginTop: 14,
                                            paddingTop: 14,
                                            borderTop: '1px solid #EEF2FF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 10,
                                            flexWrap: 'wrap'
                                        }}>
                                            <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 700 }}>
                                                Showing {startIndex + 1}-{Math.min(startIndex + USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
                                            </p>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <button
                                                    className="clay-btn-sec"
                                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                    disabled={safeCurrentPage === 1}
                                                    aria-label="Go to previous page"
                                                    style={{ padding: '6px 12px', fontSize: 12, cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer', opacity: safeCurrentPage === 1 ? 0.5 : 1 }}
                                                >
                                                    Prev
                                                </button>

                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        className={`clay-pill ${safeCurrentPage === page ? 'clay-pill-on' : ''}`}
                                                        onClick={() => setCurrentPage(page)}
                                                        aria-label={`Go to page ${page}`}
                                                        aria-current={safeCurrentPage === page ? 'page' : undefined}
                                                        style={{
                                                            minWidth: 34,
                                                            height: 32,
                                                            fontSize: 12,
                                                            padding: '0 10px',
                                                            background: safeCurrentPage === page ? undefined : 'white',
                                                            color: safeCurrentPage === page ? undefined : '#4C4C72',
                                                        }}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}

                                                <button
                                                    className="clay-btn-sec"
                                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                    disabled={safeCurrentPage === totalPages}
                                                    aria-label="Go to next page"
                                                    style={{ padding: '6px 12px', fontSize: 12, cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer', opacity: safeCurrentPage === totalPages ? 0.5 : 1 }}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* ── VIEW USER MODAL ── */}
            {viewUser && (() => {
                const rc = getRole(viewUser.role);
                const initial = viewUser.full_name?.[0]?.toUpperCase() || '?';
                return (
                    <div className="clay-overlay" onClick={() => setViewUser(null)}>
                        <div className="clay-modal" onClick={e => e.stopPropagation()}>
                            {/* Modal header strip */}
                            <div style={{ background: rc.iconGrad, padding: '24px 24px 20px', borderRadius: '26px 26px 0 0', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
                                <div style={{ position: 'absolute', bottom: -20, left: 20, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
                                {/* Avatar + name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                                    <div className="clay-avatar-lg" style={{ width: 60, height: 60, background: 'rgba(255,255,255,.25)', color: 'white', fontSize: 26, backdropFilter: 'blur(8px)', flexShrink: 0 }}>
                                        {initial}
                                    </div>
                                    <div>
                                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1 }}>{viewUser.full_name || 'Unknown'}</p>
                                        <span className="clay-badge" style={{ background: 'rgba(255,255,255,.22)', color: 'white', marginTop: 6, backdropFilter: 'blur(4px)' }}>
                                            {rc.icon} {viewUser.role?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal body */}
                            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { label: 'Full Name', value: viewUser.full_name || 'N/A' },
                                    { label: 'Email Address', value: viewUser.email },
                                    { label: 'Phone', value: viewUser.phone || 'N/A' },
                                    { label: 'Member Since', value: viewUser.created_at ? new Date(viewUser.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
                                    { label: 'User ID', value: viewUser.id, mono: true },
                                ].map(row => (
                                    <div key={row.label} className="clay-info">
                                        <span className="clay-label">{row.label}</span>
                                        <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 14, fontFamily: row.mono ? 'monospace' : 'Nunito,sans-serif', wordBreak: 'break-all' }}>{row.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '14px 22px 22px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="clay-modal-close" onClick={() => setViewUser(null)}
                                    style={{ padding: '10px 26px', fontSize: 14, color: '#4C4C72' }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── EDIT USER MODAL ── */}
            {editUser && (
                <div className="clay-overlay" onClick={() => setEditUser(null)}>
                    <div className="clay-modal" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #EEF2FF', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className="clay-ico" style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: 'white' }}>
                                <Pencil size={18} />
                            </div>
                            <div>
                                <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Edit User</p>
                                <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600 }}>{editUser.email}</p>
                            </div>
                        </div>

                        {/* Form */}
                        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Enter full name' },
                                { label: 'Email Address', key: 'email', type: 'email', placeholder: 'Enter email' },
                                { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: 'Enter phone number' },
                            ].map(f => (
                                <div key={f.key}>
                                    <span className="clay-label">{f.label}</span>
                                    <input type={f.type} value={(editForm as any)[f.key]} placeholder={f.placeholder}
                                        onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                                        className="clay-field"
                                        style={{ ...fieldStyle }} />
                                </div>
                            ))}
                            <div>
                                <span className="clay-label">Role</span>
                                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    className="clay-field"
                                    style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}>
                                    {['admin', 'doctor', 'caregiver', 'receptionist', 'lab_tech', 'pharmacist', 'supplier'].map(r => (
                                        <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '14px 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <button className="clay-modal-close" onClick={() => setEditUser(null)} disabled={isSaving}
                                style={{ padding: '10px 22px', fontSize: 14, color: '#4C4C72' }}>
                                Cancel
                            </button>
                            <button className="clay-modal-save" onClick={handleSaveEdit} disabled={isSaving}
                                style={{ padding: '10px 26px', fontSize: 14 }}>
                                {isSaving ? '⏳ Saving…' : '💾 Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}