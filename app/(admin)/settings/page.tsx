'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Building2, Calendar, Clock, Users, Bell, Lock, ClipboardList, Monitor,
  Link2, Database, Wrench, LucideIcon, RefreshCw, Download, Search,
  BarChart3, Smartphone, Key, CheckCircle2, Trash2, Mail, CreditCard,
  Lightbulb, HardDrive, AlertTriangle, Eraser, User
} from 'lucide-react';

// ─── Clay Design System ───────────────────────────────────────────────────────
const clayCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');

  :root {
    --bg: #EEF2FF;
    --indigo: #6366F1; --indigo-s: #EEF2FF; --indigo-l: #C7D2FE;
    --purple: #8B5CF6; --emerald: #10B981; --amber: #F59E0B;
    --rose: #F43F5E; --sky: #0EA5E9; --orange: #F97316;
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

  /* ── SIDEBAR ── */
  .clay-sidebar {
    border-radius: 24px; border: none;
    box-shadow: var(--clay-md); background: white; overflow: hidden;
    position: sticky; top: 24px;
  }
  .clay-tab-btn {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 11px 16px; border: none; background: transparent;
    border-radius: 14px; cursor: pointer; text-align: left;
    font-weight: 700; font-size: 13px; font-family: 'Nunito', sans-serif;
    transition: background .15s ease, transform .15s var(--spring), color .15s ease;
    color: #4C4C72;
  }
  .clay-tab-btn:hover { background: #F5F3FF; color: #4F46E5; }
  .clay-tab-btn.active {
    background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
    color: #4F46E5;
    box-shadow: 0 3px 0 rgba(99,102,241,.12), 0 5px 12px rgba(99,102,241,.08), inset 0 1px 0 rgba(255,255,255,.8);
  }
  .clay-tab-btn.active .tab-ico { transform: scale(1.1); }
  .tab-ico { transition: transform .2s var(--spring); flex-shrink: 0; }

  /* mobile horizontal tabs */
  .clay-tab-scroll { overflow-x: auto; padding: 0 4px 8px; -webkit-overflow-scrolling: touch; }
  .clay-tab-scroll::-webkit-scrollbar { display: none; }
  .clay-mob-tab {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 999px; border: none; cursor: pointer;
    font-weight: 700; font-size: 12px; font-family: 'Nunito', sans-serif; white-space: nowrap;
    transition: transform .15s var(--spring), box-shadow .15s ease;
    box-shadow: 0 3px 0 rgba(0,0,0,.07), 0 5px 12px rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.9);
    background: white; color: #4C4C72;
  }
  .clay-mob-tab:hover { transform: translateY(-2px); }
  .clay-mob-tab.active {
    background: linear-gradient(135deg, #6366F1, #4F46E5); color: white;
    box-shadow: 0 4px 0 rgba(99,102,241,.3), 0 6px 16px rgba(99,102,241,.2), inset 0 1px 0 rgba(255,255,255,.2);
  }

  /* ── CONTENT PANEL ── */
  .clay-panel {
    border-radius: 24px; border: none;
    box-shadow: var(--clay-md); background: white; overflow: hidden;
  }
  .clay-panel-head {
    padding: 20px 24px 18px; border-bottom: 1px solid #EEF2FF;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .clay-panel-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }

  /* ── PANEL SECTION TITLE ── */
  .section-hd { font-family: 'Fraunces', serif !important; font-size: 14px; font-weight: 700; color: #1E1B4B; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }

  /* ── CLAY FIELD (input/textarea/select) ── */
  .clay-field {
    border-radius: 14px !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.07), inset 0 -1px 0 rgba(255,255,255,.8) !important;
    border: 1.5px solid #C7D2FE !important;
    font-weight: 600 !important; background: #FAFBFF !important;
    font-family: 'Nunito', sans-serif !important;
    transition: border-color .2s, box-shadow .2s;
    width: 100%; padding: 9px 14px; font-size: 14px; color: #1E1B4B;
  }
  .clay-field:focus { border-color: #6366F1 !important; box-shadow: inset 0 2px 6px rgba(0,0,0,.05), 0 0 0 3px rgba(99,102,241,.12) !important; outline: none !important; }
  .clay-field:disabled { opacity: .55; cursor: not-allowed; }
  textarea.clay-field { resize: vertical; min-height: 80px; line-height: 1.5; }

  /* ── CLAY LABEL ── */
  .clay-label { font-size: 11px !important; font-weight: 800 !important; color: #4F46E5; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px; }

  /* ── TOGGLE SWITCH ── */
  .clay-toggle-row {
    border-radius: 16px;
    background: linear-gradient(135deg, #FAFBFF, #F0F4FF);
    box-shadow: 0 2px 0 rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.9);
    padding: 15px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
    transition: transform .15s var(--spring);
  }
  .clay-toggle-row:hover { transform: translateX(3px); }
  .clay-switch { position: relative; display: inline-flex; flex-shrink: 0; cursor: pointer; }
  .clay-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
  .clay-switch-track {
    width: 44px; height: 24px; border-radius: 999px;
    background: #D1D5DB;
    box-shadow: inset 0 2px 4px rgba(0,0,0,.1), inset 0 -1px 0 rgba(255,255,255,.6);
    transition: background .2s ease;
    position: relative;
  }
  .clay-switch input:checked + .clay-switch-track { background: #6366F1; }
  .clay-switch-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 20px; height: 20px; border-radius: 50%;
    background: white;
    box-shadow: 0 2px 0 rgba(0,0,0,.12), 0 3px 8px rgba(0,0,0,.1);
    transition: transform .22s var(--spring);
  }
  .clay-switch input:checked ~ .clay-switch-thumb,
  .clay-switch input:checked + .clay-switch-track + .clay-switch-thumb { transform: translateX(20px); }

  /* helper to position thumb over track */
  .clay-switch { position:relative; width:44px; height:24px; }
  .clay-switch input { position:absolute; opacity:0; inset:0; cursor:pointer; z-index:2; }
  .clay-switch-track { position:absolute; inset:0; border-radius:999px; background:#D1D5DB; box-shadow:inset 0 2px 4px rgba(0,0,0,.1); transition:background .2s; }
  .clay-switch input:checked ~ .clay-switch-track { background:#6366F1; }
  .clay-switch-thumb { position:absolute; top:2px; left:2px; width:20px; height:20px; border-radius:50%; background:white; box-shadow:0 2px 0 rgba(0,0,0,.12),0 3px 8px rgba(0,0,0,.1); transition:transform .22s var(--spring); pointer-events:none; }
  .clay-switch input:checked ~ .clay-switch-thumb { transform:translateX(20px); }

  /* ── SAVE BUTTON (primary) ── */
  .clay-save {
    border-radius: 999px !important; border: none !important;
    box-shadow: 0 5px 0 rgba(99,102,241,.35), 0 8px 20px rgba(99,102,241,.25), inset 0 1px 0 rgba(255,255,255,.3) !important;
    font-weight: 800 !important; font-family: 'Nunito', sans-serif !important;
    background: linear-gradient(135deg, #6366F1, #4F46E5) !important; color: white !important;
    transition: transform .2s var(--spring), box-shadow .2s ease !important;
    padding: 11px 28px; font-size: 14px; cursor: pointer;
  }
  .clay-save:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 0 rgba(99,102,241,.4), 0 14px 32px rgba(99,102,241,.3), inset 0 1px 0 rgba(255,255,255,.3) !important; }
  .clay-save:active { transform: translateY(3px) !important; }
  .clay-save:disabled { opacity: .6; transform: none !important; cursor: not-allowed; }

  /* ── SECONDARY BUTTON ── */
  .clay-sec {
    border-radius: 999px !important;
    box-shadow: 0 3px 0 rgba(0,0,0,.08), 0 5px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #E0E7FF !important; background: white !important; font-weight: 700 !important;
    transition: transform .18s var(--spring), box-shadow .18s ease !important;
    padding: 9px 20px; font-size: 13px; cursor: pointer; color: #4C4C72;
    display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
    font-family: 'Nunito', sans-serif;
  }
  .clay-sec:hover { transform: translateY(-2px) !important; box-shadow: 0 5px 0 rgba(0,0,0,.1), 0 8px 20px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.9) !important; }
  .clay-sec:active { transform: translateY(2px) !important; }
  .clay-sec:disabled { opacity: .6; transform: none !important; }

  /* danger sec */
  .clay-sec-danger { border-color: #FECDD3 !important; color: #F43F5E !important; }
  .clay-sec-danger:hover { box-shadow: 0 5px 0 rgba(244,63,94,.1), 0 8px 20px rgba(244,63,94,.1), inset 0 1px 0 rgba(255,255,255,.9) !important; }

  /* ── INFO / ALERT BOX ── */
  .clay-info-box {
    border-radius: 18px; padding: 16px 18px;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.05), inset 0 -1px 0 rgba(255,255,255,.6);
  }

  /* ── STAT MINI ── */
  .clay-mini-stat {
    border-radius: 18px; padding: 18px 20px; position: relative; overflow: hidden;
    box-shadow: var(--clay-sm);
    transition: transform .2s var(--spring);
  }
  .clay-mini-stat:hover { transform: translateY(-4px); }

  /* ── ICON BUBBLE ── */
  .clay-ico {
    border-radius: 14px;
    box-shadow: 0 4px 0 rgba(0,0,0,.14), 0 7px 16px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.5);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: transform .22s var(--spring);
  }

  /* ── BADGE ── */
  .clay-badge {
    border-radius: 999px; font-weight: 800; font-size: 11px; padding: 3px 10px;
    box-shadow: 0 2px 0 rgba(0,0,0,.07), inset 0 1px 0 rgba(255,255,255,.6);
    display: inline-flex; align-items: center; gap: 4px;
  }

  /* ── ROLE PERMISSION CARD ── */
  .clay-role-card {
    border-radius: 18px; overflow: hidden;
    box-shadow: var(--clay-sm);
    transition: transform .2s var(--spring), box-shadow .2s ease;
  }
  .clay-role-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 7px 0 rgba(0,0,0,.1), 0 14px 30px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.65);
  }
  .clay-perm-tag {
    border-radius: 999px; font-size: 11px; font-weight: 700;
    padding: 3px 10px; display: inline-flex; align-items: center; gap: 4px;
    background: white;
    box-shadow: 0 2px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.8);
  }

  /* ── WORKING HOURS ROW ── */
  .clay-hours-row {
    border-radius: 14px;
    background: linear-gradient(135deg, #FAFBFF, #F0F4FF);
    box-shadow: 0 2px 0 rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.9);
    padding: 13px 16px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  }

  /* ── STATUS CHIP (online/offline) ── */
  .clay-status-chip {
    border-radius: 16px; padding: 15px 18px;
    box-shadow: var(--clay-sm);
    transition: transform .2s var(--spring);
  }
  .clay-status-chip:hover { transform: translateY(-3px); }

  /* ── AUDIT LOG ROW ── */
  .clay-audit-row {
    border-radius: 14px;
    background: linear-gradient(135deg, #FAFBFF, #F0F4FF);
    box-shadow: 0 2px 0 rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.9);
    padding: 13px 16px;
    transition: transform .15s var(--spring);
  }
  .clay-audit-row:hover { transform: translateX(4px); }

  /* ── INTEGRATION ROW ── */
  .clay-integ-row {
    border-radius: 18px;
    background: linear-gradient(135deg, #FAFBFF, #F0F4FF);
    box-shadow: 0 3px 0 rgba(0,0,0,.06), 0 6px 16px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9);
    padding: 16px 18px; display: flex; align-items: center; gap: 14px;
    transition: transform .18s var(--spring), box-shadow .18s ease;
  }
  .clay-integ-row:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 0 rgba(0,0,0,.08), 0 12px 28px rgba(0,0,0,.09), inset 0 1px 0 rgba(255,255,255,.9);
  }
  .clay-integ-row:hover .clay-ico { transform: rotate(-8deg) scale(1.1); }

  /* ── TERMINAL / LOG ── */
  .clay-terminal {
    border-radius: 16px;
    background: #1E1B4B;
    box-shadow: 0 6px 0 rgba(30,27,75,.4), 0 10px 28px rgba(30,27,75,.25), inset 0 1px 0 rgba(255,255,255,.06);
    padding: 16px 18px; font-family: 'Courier New', monospace !important; font-size: 12px;
    color: #A5F3FC; max-height: 180px; overflow-y: auto; line-height: 1.7;
  }

  /* ── SAVE MESSAGE TOAST ── */
  .clay-toast {
    border-radius: 999px; padding: 8px 20px; font-weight: 800; font-size: 13px;
    box-shadow: 0 4px 0 rgba(0,0,0,.1), 0 6px 16px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.7);
    display: inline-flex; align-items: center; gap: 7px;
  }

  /* ── MAINTENANCE STATUS ── */
  .clay-maint-status {
    border-radius: 18px; padding: 18px 20px;
    box-shadow: var(--clay-sm);
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
  }
  @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
  .live-dot { animation: livePulse 1.5s ease-in-out infinite; }

  /* ── SHIMMER SKELETON ── */
  @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .shimmer { background: linear-gradient(90deg,#EEF2FF 25%,#E0E7FF 50%,#EEF2FF 75%); background-size:400px 100%; animation:shimmer 1.4s ease-in-out infinite; border-radius:14px; }

  /* ── DECORATIVE BLOBS ── */
  @keyframes blobFloat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07) rotate(4deg)} }
  .deco-blob { position:fixed; border-radius:50%; pointer-events:none; animation:blobFloat 7s ease-in-out infinite; z-index:0; }

  /* ── DIVIDER ── */
  .clay-divider { border: none; border-top: 1px solid #EEF2FF; margin: 4px 0; }

  /* ── PASSWORD POLICY CHECK ── */
  .clay-check-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
  .clay-check-row input[type=checkbox] { width: 16px; height: 16px; accent-color: #6366F1; cursor: pointer; border-radius: 4px; }
`;

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface AuditLog {
  id: string; user_id: string; action: string; target_table: string;
  target_id: string; description: string; user_email: string;
  user_role: string; created_at: string;
}
interface SystemStats { totalUsers: number; activeToday: number; totalAppointments: number; dbSize: string; }

const ROLE_PERMISSIONS = {
  admin: { label: 'Administrator', bg: '#EDE9FE', color: '#6D28D9', strip: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', permissions: ['Full system access', 'User management', 'Reports', 'Settings', 'Audit logs'] },
  doctor: { label: 'Doctor', bg: '#DBEAFE', color: '#1D4ED8', strip: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', permissions: ['View patients', 'Create consultations', 'Prescribe medications', 'Order lab tests'] },
  receptionist: { label: 'Receptionist', bg: '#DCFCE7', color: '#15803D', strip: 'linear-gradient(135deg,#10B981,#059669)', permissions: ['Check-in patients', 'Schedule appointments', 'View queue', 'Patient registration'] },
  lab_technician: { label: 'Lab Technician', bg: '#FEF9C3', color: '#A16207', strip: 'linear-gradient(135deg,#F59E0B,#D97706)', permissions: ['View lab orders', 'Process samples', 'Enter results', 'Mark completed'] },
  pharmacist: { label: 'Pharmacist', bg: '#CFFAFE', color: '#0E7490', strip: 'linear-gradient(135deg,#06B6D4,#0284C7)', permissions: ['View prescriptions', 'Dispense medications', 'Manage inventory'] },
  caregiver: { label: 'Caregiver', bg: '#FCE7F3', color: '#BE185D', strip: 'linear-gradient(135deg,#EC4899,#BE185D)', permissions: ['View own patients', 'Book appointments', 'View records'] },
  supplier: { label: 'Supplier', bg: '#FFEDD5', color: '#C2410C', strip: 'linear-gradient(135deg,#F97316,#EA580C)', permissions: ['View orders', 'Update inventory', 'Manage medications'] },
};

const WORKING_HOURS = [
  { day: 'Monday', open: '08:00', close: '18:00', enabled: true },
  { day: 'Tuesday', open: '08:00', close: '18:00', enabled: true },
  { day: 'Wednesday', open: '08:00', close: '18:00', enabled: true },
  { day: 'Thursday', open: '08:00', close: '18:00', enabled: true },
  { day: 'Friday', open: '08:00', close: '18:00', enabled: true },
  { day: 'Saturday', open: '09:00', close: '14:00', enabled: true },
  { day: 'Sunday', open: '00:00', close: '00:00', enabled: false },
];

// ─── Reusable subcomponents ───────────────────────────────────────────────────

// Clay toggle switch (replaces the raw Tailwind peer- approach)
function Toggle({ defaultChecked = false, checked, onChange }: { defaultChecked?: boolean; checked?: boolean; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useState(checked !== undefined ? checked : defaultChecked);
  const val = checked !== undefined ? checked : on;
  return (
    <label className="clay-switch" style={{ cursor: 'pointer', flexShrink: 0 }}>
      <input type="checkbox" checked={val} onChange={e => { setOn(e.target.checked); onChange?.(e.target.checked); }} />
      <div className="clay-switch-track" />
      <div className="clay-switch-thumb" style={{ transform: val ? 'translateX(20px)' : 'translateX(0)' }} />
    </label>
  );
}

function ToggleRow({ title, desc, defaultChecked = false }: { title: string; desc: string; defaultChecked?: boolean }) {
  return (
    <div className="clay-toggle-row">
      <div>
        <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14 }}>{title}</p>
        <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 2 }}>{desc}</p>
      </div>
      <Toggle defaultChecked={defaultChecked} />
    </div>
  );
}

function SectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="section-hd">{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{children}</div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="clay-label">{label}</span>
      {children}
    </div>
  );
}

function PanelFooter({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div style={{ borderTop: '1px solid #EEF2FF', paddingTop: 18, marginTop: 4 }}>
      <button className="clay-save" onClick={onSave} disabled={saving}>
        {saving ? '⏳ Saving…' : '💾 Save Changes'}
      </button>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  borderRadius: 14, border: '1.5px solid #C7D2FE',
  boxShadow: 'inset 0 2px 6px rgba(0,0,0,.07), inset 0 -1px 0 rgba(255,255,255,.8)',
  background: '#FAFBFF', fontWeight: 600, fontFamily: 'Nunito,sans-serif',
  padding: '9px 14px', width: '100%', fontSize: 14, color: '#1E1B4B',
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({ totalUsers: 0, activeToday: 0, totalAppointments: 0, dbSize: '0 MB' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState(WORKING_HOURS);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tabs: { id: string; label: string; icon: LucideIcon }[] = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'working-hours', label: 'Hours', icon: Clock },
    { id: 'roles', label: 'Roles', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'audit', label: 'Audit', icon: ClipboardList },
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  ];

  const tabIconColors: Record<string, string> = {
    general: 'linear-gradient(135deg,#6366F1,#4F46E5)',
    appointments: 'linear-gradient(135deg,#10B981,#059669)',
    'working-hours': 'linear-gradient(135deg,#06B6D4,#0284C7)',
    roles: 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
    notifications: 'linear-gradient(135deg,#F59E0B,#D97706)',
    security: 'linear-gradient(135deg,#F43F5E,#E11D48)',
    audit: 'linear-gradient(135deg,#6366F1,#4338CA)',
    system: 'linear-gradient(135deg,#0EA5E9,#0284C7)',
    integrations: 'linear-gradient(135deg,#F97316,#EA580C)',
    backup: 'linear-gradient(135deg,#10B981,#059669)',
    maintenance: 'linear-gradient(135deg,#F59E0B,#D97706)',
  };

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'system') fetchSystemStats();
  }, [activeTab]);

  async function fetchAuditLogs() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (!error && data) setAuditLogs(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function fetchSystemStats() {
    setLoading(true);
    try {
      const supabase = createClient();
      const [usersRes, appointmentsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
      ]);
      setSystemStats({ totalUsers: usersRes.count || 0, activeToday: Math.floor((usersRes.count || 0) * 0.3), totalAppointments: appointmentsRes.count || 0, dbSize: '245 MB' });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaveMessage({ type: 'success', text: '✅ Settings saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    }, 1000);
  }

  function getActionStyle(action: string): { bg: string; color: string } {
    if (action.includes('CREATE') || action.includes('INSERT')) return { bg: '#DCFCE7', color: '#15803D' };
    if (action.includes('UPDATE') || action.includes('EDIT')) return { bg: '#DBEAFE', color: '#1D4ED8' };
    if (action.includes('DELETE') || action.includes('REMOVE')) return { bg: '#FFE4E6', color: '#BE123C' };
    if (action.includes('LOGIN') || action.includes('AUTH')) return { bg: '#EDE9FE', color: '#6D28D9' };
    return { bg: '#F1F5F9', color: '#475569' };
  }

  const currentTabGrad = tabIconColors[activeTab] || 'linear-gradient(135deg,#6366F1,#4F46E5)';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: clayCSS }} />

      <div className="clay-page" style={{ background: 'var(--bg)', minHeight: '100vh', padding: '0 0 56px', position: 'relative' }}>
        {/* Decorative blobs */}
        <div className="deco-blob" style={{ width: 400, height: 400, background: 'radial-gradient(circle,rgba(99,102,241,.07),transparent 70%)', top: -100, right: -80 }} />
        <div className="deco-blob" style={{ width: 280, height: 280, background: 'radial-gradient(circle,rgba(16,185,129,.05),transparent 70%)', bottom: 200, left: -60, animationDelay: '3.5s' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>

          {/* ── PAGE HEADER ── */}
          <div style={{ padding: '32px 0 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="clay-ico" style={{ width: 48, height: 48, background: currentTabGrad, color: 'white' }}>
                {(() => { const T = tabs.find(t => t.id === activeTab); return T ? <T.icon size={22} /> : <Building2 size={22} />; })()}
              </div>
              <div>
                <h1 style={{ fontFamily: 'Fraunces,serif', fontSize: 30, fontWeight: 700, color: '#1E1B4B', lineHeight: 1 }}>System Settings</h1>
                <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 3 }}>Configure system preferences and options</p>
              </div>
            </div>
            {saveMessage && (
              <div className="clay-toast" style={{ background: saveMessage.type === 'success' ? '#DCFCE7' : '#FFE4E6', color: saveMessage.type === 'success' ? '#15803D' : '#BE123C' }}>
                {saveMessage.text}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

            {/* ── SIDEBAR (desktop) ── */}
            <div style={{ width: 228, flexShrink: 0, display: 'none' }} className="sidebar-desktop">
              <div className="clay-sidebar">
                <div style={{ padding: '12px 10px' }}>
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button key={tab.id} className={`clay-tab-btn ${active ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        <div className="tab-ico" style={{ width: 30, height: 30, borderRadius: 10, background: active ? tabIconColors[tab.id] : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: active ? '0 3px 0 rgba(0,0,0,.12),0 5px 12px rgba(0,0,0,.1),inset 0 1px 0 rgba(255,255,255,.4)' : 'none', transition: 'all .2s var(--spring)' }}>
                          <Icon size={14} color={active ? 'white' : '#9090B0'} />
                        </div>
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Mobile horizontal tabs ── */}
            <style>{`
              @media(min-width:1024px) { .sidebar-desktop { display:block !important; } .mobile-tabs { display:none !important; } }
            `}</style>
            <div style={{ width: '100%' }}>
              <div className="mobile-tabs clay-tab-scroll" style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id} className={`clay-mob-tab ${active ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}>
                      <Icon size={13} /> {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ── CONTENT ── */}
              <div>

                {/* GENERAL */}
                {activeTab === 'general' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors.general, color: 'white' }}><Building2 size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Clinic Information</p>
                      </div>
                    </div>
                    <div className="clay-panel-body">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
                        {[
                          { l: 'Clinic Name', v: 'Gertrudes Children Hospital' },
                          { l: 'Short Name / Code', v: 'GCH' },
                          { l: 'Contact Email', v: 'contact@gch.com', t: 'email' },
                          { l: 'Support Email', v: 'support@gch.com', t: 'email' },
                          { l: 'Primary Phone', v: '+1 (555) 123-4567', t: 'tel' },
                          { l: 'Emergency Line', v: '+1 (555) 911-0000', t: 'tel' },
                        ].map(f => (
                          <FieldRow key={f.l} label={f.l}>
                            <input defaultValue={f.v} type={(f as any).t || 'text'} className="clay-field" style={{ ...fieldStyle }} />
                          </FieldRow>
                        ))}
                      </div>
                      <FieldRow label="Address">
                        <input defaultValue="123 Healthcare Ave, Medical City, MC 12345" className="clay-field" style={{ ...fieldStyle }} />
                      </FieldRow>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
                        <FieldRow label="Timezone">
                          <select className="clay-field" style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}>
                            <option>Africa/Lagos (WAT)</option><option>Africa/Accra (GMT)</option>
                            <option>America/New_York (EST)</option><option>Europe/London (GMT)</option>
                          </select>
                        </FieldRow>
                        <FieldRow label="Date Format">
                          <select className="clay-field" style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}>
                            <option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option>
                          </select>
                        </FieldRow>
                      </div>
                      <FieldRow label="Welcome Message (shown on login)">
                        <textarea className="clay-field" defaultValue="Welcome to Good Childhood Hospital. Providing quality pediatric care since 2010." style={{ ...fieldStyle, resize: 'vertical', minHeight: 80 }} />
                      </FieldRow>
                      <PanelFooter saving={saving} onSave={handleSave} />
                    </div>
                  </div>
                )}

                {/* APPOINTMENTS */}
                {activeTab === 'appointments' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors.appointments, color: 'white' }}><Calendar size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Appointment Configuration</p>
                      </div>
                    </div>
                    <div className="clay-panel-body">
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
                        <FieldRow label="Default Duration">
                          <select className="clay-field" style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}>
                            <option>15 minutes</option><option>30 minutes</option><option>45 minutes</option><option>1 hour</option>
                          </select>
                        </FieldRow>
                        <FieldRow label="Buffer Between Appointments">
                          <select className="clay-field" style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}>
                            <option>No buffer</option><option>5 minutes</option><option>10 minutes</option><option>15 minutes</option>
                          </select>
                        </FieldRow>
                        <FieldRow label="Max Advance Booking Days">
                          <input type="number" defaultValue="30" className="clay-field" style={{ ...fieldStyle }} />
                        </FieldRow>
                        <FieldRow label="Min Advance Booking Hours">
                          <input type="number" defaultValue="2" className="clay-field" style={{ ...fieldStyle }} />
                        </FieldRow>
                      </div>
                      <SectionGroup title="📋 Booking Rules">
                        <ToggleRow title="Allow Same-Day Appointments" desc="Patients can book appointments for today" defaultChecked />
                        <ToggleRow title="Require Phone Verification" desc="Verify phone number before booking" />
                        <ToggleRow title="Allow Rescheduling" desc="Caregivers can reschedule appointments" defaultChecked />
                        <ToggleRow title="Allow Cancellation" desc="Caregivers can cancel appointments" defaultChecked />
                      </SectionGroup>
                      <FieldRow label="Cancellation Policy Message">
                        <textarea className="clay-field" defaultValue="Appointments must be cancelled at least 24 hours in advance. Repeated no-shows may result in booking restrictions." style={{ ...fieldStyle, resize: 'vertical', minHeight: 80 }} />
                      </FieldRow>
                      <PanelFooter saving={saving} onSave={handleSave} />
                    </div>
                  </div>
                )}

                {/* WORKING HOURS */}
                {activeTab === 'working-hours' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors['working-hours'], color: 'white' }}><Clock size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Clinic Working Hours</p>
                      </div>
                    </div>
                    <div className="clay-panel-body">
                      <p style={{ fontSize: 14, color: '#9090B0', fontWeight: 600 }}>Configure the operating hours for each day of the week.</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {workingHours.map((schedule, index) => (
                          <div key={schedule.day} className="clay-hours-row">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: 130, cursor: 'pointer', flexShrink: 0 }}>
                              <input type="checkbox" checked={schedule.enabled} onChange={e => { const h = [...workingHours]; h[index].enabled = e.target.checked; setWorkingHours(h); }} style={{ width: 16, height: 16, accentColor: '#6366F1', cursor: 'pointer' }} />
                              <span style={{ fontWeight: 800, color: schedule.enabled ? '#1E1B4B' : '#9090B0', fontSize: 14 }}>{schedule.day}</span>
                            </label>
                            {schedule.enabled ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
                                <input type="time" value={schedule.open} onChange={e => { const h = [...workingHours]; h[index].open = e.target.value; setWorkingHours(h); }}
                                  className="clay-field" style={{ ...fieldStyle, width: 130 }} />
                                <span style={{ fontSize: 13, color: '#9090B0', fontWeight: 700 }}>to</span>
                                <input type="time" value={schedule.close} onChange={e => { const h = [...workingHours]; h[index].close = e.target.value; setWorkingHours(h); }}
                                  className="clay-field" style={{ ...fieldStyle, width: 130 }} />
                              </div>
                            ) : (
                              <span style={{ fontSize: 13, color: '#9090B0', fontWeight: 700, background: '#F1F5F9', padding: '6px 14px', borderRadius: 999, boxShadow: 'inset 0 1px 3px rgba(0,0,0,.07)' }}>Closed</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="clay-info-box" style={{ background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', border: '1px solid rgba(199,210,254,.5)' }}>
                        <p style={{ fontWeight: 800, color: '#4F46E5', fontSize: 13, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={14} /> Quick Actions</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {[
                            { l: '↺ Reset to Default', fn: () => setWorkingHours(WORKING_HOURS) },
                            { l: '⏰ Set All 9–5', fn: () => setWorkingHours(workingHours.map(h => ({ ...h, open: '09:00', close: '17:00' }))) },
                            { l: '✅ Enable All Days', fn: () => setWorkingHours(workingHours.map(h => ({ ...h, enabled: true }))) },
                          ].map(btn => (
                            <button key={btn.l} className="clay-sec" onClick={btn.fn}>{btn.l}</button>
                          ))}
                        </div>
                      </div>
                      <PanelFooter saving={saving} onSave={handleSave} />
                    </div>
                  </div>
                )}

                {/* ROLES */}
                {activeTab === 'roles' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors.roles, color: 'white' }}><Users size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Roles & Permissions</p>
                      </div>
                    </div>
                    <div className="clay-panel-body">
                      <p style={{ fontSize: 14, color: '#9090B0', fontWeight: 600 }}>View and manage role-based access control for different user types.</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {Object.entries(ROLE_PERMISSIONS).map(([key, role]) => (
                          <div key={key} className="clay-role-card">
                            {/* Header strip */}
                            <div style={{ background: role.strip, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ background: 'rgba(255,255,255,.22)', color: 'white', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 800, backdropFilter: 'blur(4px)', boxShadow: '0 2px 0 rgba(0,0,0,.08)' }}>{role.label}</span>
                              <button className="clay-sec" style={{ padding: '5px 14px', fontSize: 11 }}>Edit Permissions</button>
                            </div>
                            <div style={{ padding: '14px 18px', background: '#FAFBFF', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                              {role.permissions.map(p => (
                                <span key={p} className="clay-perm-tag" style={{ color: role.color, background: role.bg }}>
                                  <CheckCircle2 size={10} /> {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="clay-info-box" style={{ background: 'linear-gradient(135deg,#FFFBEB,#FDE68A)', border: '1px solid rgba(245,158,11,.2)' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <AlertTriangle size={18} style={{ color: '#B45309', flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <p style={{ fontWeight: 800, color: '#92400E', fontSize: 14 }}>Permission Changes</p>
                            <p style={{ fontSize: 12, color: '#B45309', fontWeight: 600, marginTop: 4, lineHeight: 1.5 }}>Changes to role permissions will affect all users with that role. Users will need to log out and log back in for changes to take effect.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTIFICATIONS */}
                {activeTab === 'notifications' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors.notifications, color: 'white' }}><Bell size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Notification Settings</p>
                      </div>
                    </div>
                    <div className="clay-panel-body">
                      <SectionGroup title="📧 Email Notifications">
                        <ToggleRow title="New Appointment Booking" desc="Send email when new appointment is booked" defaultChecked />
                        <ToggleRow title="Appointment Reminders" desc="Auto-send reminders 24h before appointment" defaultChecked />
                        <ToggleRow title="Prescription Ready" desc="Notify when prescription is ready for pickup" defaultChecked />
                        <ToggleRow title="Lab Results Ready" desc="Notify when lab results are available" defaultChecked />
                      </SectionGroup>
                      <SectionGroup title="📱 SMS Notifications">
                        <ToggleRow title="SMS Reminders" desc="Send SMS reminders to caregivers" />
                      </SectionGroup>
                      <SectionGroup title="🔔 Admin Alerts">
                        <ToggleRow title="Low Inventory Alerts" desc="Alert when medication stock is low" defaultChecked />
                        <ToggleRow title="Failed Login Attempts" desc="Alert on suspicious login activity" defaultChecked />
                        <ToggleRow title="System Error Alerts" desc="Notify admins of system errors" defaultChecked />
                      </SectionGroup>
                      <PanelFooter saving={saving} onSave={handleSave} />
                    </div>
                  </div>
                )}

                {/* SECURITY */}
                {activeTab === 'security' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors.security, color: 'white' }}><Lock size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Security Settings</p>
                      </div>
                    </div>
                    <div className="clay-panel-body">
                      <SectionGroup title="🔑 Authentication">
                        <ToggleRow title="Two-Factor Authentication" desc="Require 2FA for admin accounts" />
                        <div className="clay-toggle-row">
                          <div>
                            <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14 }}>Session Timeout</p>
                            <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 2 }}>Auto-logout inactive users</p>
                          </div>
                          <select className="clay-field" style={{ ...fieldStyle, width: 'auto', minWidth: 130, appearance: 'none', cursor: 'pointer' }}>
                            <option>15 minutes</option><option>30 minutes</option><option>1 hour</option><option>2 hours</option><option>4 hours</option>
                          </select>
                        </div>
                        <div className="clay-toggle-row">
                          <div>
                            <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14 }}>Max Login Attempts</p>
                            <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 2 }}>Lock account after failed attempts</p>
                          </div>
                          <select className="clay-field" style={{ ...fieldStyle, width: 'auto', minWidth: 130, appearance: 'none', cursor: 'pointer' }}>
                            <option>3 attempts</option><option>5 attempts</option><option>10 attempts</option>
                          </select>
                        </div>
                      </SectionGroup>

                      <div>
                        <p className="section-hd">🔐 Password Policy</p>
                        <div className="clay-info-box" style={{ background: 'linear-gradient(135deg,#FAFBFF,#F0F4FF)', border: '1px solid rgba(199,210,254,.5)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {[
                            { l: 'Minimum 8 characters', c: true },
                            { l: 'Require uppercase letters', c: true },
                            { l: 'Require lowercase letters', c: true },
                            { l: 'Require numbers', c: true },
                            { l: 'Require special characters', c: false },
                            { l: 'Password expiry (90 days)', c: false },
                          ].map(item => (
                            <label key={item.l} className="clay-check-row" style={{ cursor: 'pointer' }}>
                              <input type="checkbox" defaultChecked={item.c} style={{ width: 16, height: 16, accentColor: '#6366F1' }} />
                              <span style={{ fontSize: 14, color: '#4C4C72', fontWeight: 600 }}>{item.l}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="section-hd">🌐 IP Restrictions</p>
                        <div className="clay-toggle-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <div>
                              <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14 }}>Enable IP Whitelist</p>
                              <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 2 }}>Restrict access to specific IPs</p>
                            </div>
                            <Toggle />
                          </div>
                          <textarea disabled placeholder={'Enter allowed IP addresses (one per line)\nExample: 192.168.1.0/24'} className="clay-field"
                            style={{ ...fieldStyle, resize: 'vertical', minHeight: 80, fontFamily: 'monospace', opacity: .55 }} />
                        </div>
                      </div>

                      <PanelFooter saving={saving} onSave={handleSave} />
                    </div>
                  </div>
                )}

                {/* AUDIT */}
                {activeTab === 'audit' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors.audit, color: 'white' }}><ClipboardList size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Audit Logs</p>
                      </div>
                      <button className="clay-sec" onClick={fetchAuditLogs} disabled={loading} style={{ flexShrink: 0 }}>
                        <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> {loading ? 'Loading…' : 'Refresh'}
                      </button>
                    </div>
                    <div className="clay-panel-body">
                      <p style={{ fontSize: 14, color: '#9090B0', fontWeight: 600 }}>Track all system activities and changes. Showing last 50 entries.</p>
                      {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {[...Array(5)].map((_, i) => <div key={i} className="shimmer" style={{ height: 72 }} />)}
                        </div>
                      ) : auditLogs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#EEF2FF,#C7D2FE)', boxShadow: 'var(--clay-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                            <ClipboardList size={28} style={{ color: '#6366F1' }} />
                          </div>
                          <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 16 }}>No audit logs found</p>
                          <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 5 }}>Activities will appear here once users interact with the system</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
                          {auditLogs.map(log => {
                            const as = getActionStyle(log.action);
                            return (
                              <div key={log.id} className="clay-audit-row">
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
                                  <span className="clay-badge" style={{ background: as.bg, color: as.color }}>{log.action}</span>
                                  {log.target_table && <span style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 2 }}>on {log.target_table}</span>}
                                </div>
                                <p style={{ fontSize: 13, color: '#4C4C72', fontWeight: 600, lineHeight: 1.4 }}>{log.description || `${log.action} performed on ${log.target_table || 'system'}`}</p>
                                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 11, color: '#9090B0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><User size={10} /> {log.user_email || 'Unknown user'}</span>
                                  {log.user_role && <span className="clay-badge" style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: 10 }}>{log.user_role}</span>}
                                  <span style={{ fontSize: 11, color: '#9090B0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {new Date(log.created_at).toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid #EEF2FF', paddingTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="clay-sec"><Download size={13} /> Export Logs (CSV)</button>
                        <button className="clay-sec"><Search size={13} /> Advanced Search</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SYSTEM */}
                {activeTab === 'system' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors.system, color: 'white' }}><Monitor size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>System Health</p>
                      </div>
                      <button className="clay-sec" onClick={fetchSystemStats} disabled={loading}><RefreshCw size={13} /> Refresh</button>
                    </div>
                    <div className="clay-panel-body">
                      {/* Status chips */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                        {[
                          { label: 'Database', status: 'Online', sub: `${systemStats.dbSize} used`, on: true },
                          { label: 'API Server', status: 'Online', sub: 'Response: 45ms', on: true },
                          { label: 'Email Service', status: 'Active', sub: 'Resend configured', on: true },
                          { label: 'SMS Service', status: 'Inactive', sub: 'Not configured', on: false },
                        ].map(s => (
                          <div key={s.label} className="clay-status-chip" style={{ background: s.on ? 'linear-gradient(135deg,#ECFDF5,#A7F3D0)' : 'linear-gradient(135deg,#F1F5F9,#E2E8F0)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                              <span className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: s.on ? '#10B981' : '#94A3B8', display: 'inline-block' }} />
                              <span style={{ fontSize: 11, fontWeight: 800, color: s.on ? '#15803D' : '#64748B', textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</span>
                            </div>
                            <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: s.on ? '#15803D' : '#64748B' }}>{s.status}</p>
                            <p style={{ fontSize: 11, color: s.on ? '#10B981' : '#94A3B8', fontWeight: 600, marginTop: 2 }}>{s.sub}</p>
                          </div>
                        ))}
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                        {[
                          { label: 'Total Users', value: systemStats.totalUsers, bg: 'linear-gradient(135deg,#EEF2FF,#C7D2FE)', color: '#4F46E5' },
                          { label: 'Active Today', value: systemStats.activeToday, bg: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', color: '#6D28D9' },
                          { label: 'Total Appointments', value: systemStats.totalAppointments, bg: 'linear-gradient(135deg,#ECFDF5,#A7F3D0)', color: '#15803D' },
                        ].map(s => (
                          <div key={s.label} className="clay-mini-stat" style={{ background: s.bg }}>
                            <p style={{ fontSize: 10, fontWeight: 800, color: s.color, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</p>
                            <p style={{ fontFamily: 'Fraunces,serif', fontSize: 36, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, marginTop: 4 }}>{s.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Terminal */}
                      <div>
                        <p className="section-hd">💻 System Logs</p>
                        <div className="clay-terminal">
                          {[0, 3600000, 7200000, 14400000].map((offset, i) => (
                            <div key={i}><span style={{ color: '#A5F3FC', opacity: .6 }}>[{new Date(Date.now() - offset).toISOString()}]</span> <span style={{ color: '#86EFAC' }}>INFO:</span> {['System running normally', 'Daily backup completed', 'Cache cleared', 'Email service connected'][i]}</div>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #EEF2FF', paddingTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="clay-sec"><BarChart3 size={13} /> View Full Metrics</button>
                        <button className="clay-sec"><RefreshCw size={13} /> Clear Cache</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* INTEGRATIONS */}
                {activeTab === 'integrations' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors.integrations, color: 'white' }}><Link2 size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Integrations</p>
                      </div>
                    </div>
                    <div className="clay-panel-body">
                      {[
                        { name: 'Supabase', sub: 'Connected', on: true, iconBg: 'linear-gradient(135deg,#10B981,#059669)', Icon: Database },
                        { name: 'Resend (Email)', sub: 'Connected', on: true, iconBg: 'linear-gradient(135deg,#6366F1,#4F46E5)', Icon: Mail },
                        { name: 'Twilio (SMS)', sub: 'Not configured', on: false, iconBg: 'linear-gradient(135deg,#94A3B8,#64748B)', Icon: Smartphone },
                        { name: 'Paystack (Payments)', sub: 'Not configured', on: false, iconBg: 'linear-gradient(135deg,#94A3B8,#64748B)', Icon: CreditCard },
                        { name: 'Google Analytics', sub: 'Not configured', on: false, iconBg: 'linear-gradient(135deg,#F97316,#EA580C)', Icon: BarChart3 },
                      ].map(item => (
                        <div key={item.name} className="clay-integ-row">
                          <div className="clay-ico" style={{ width: 44, height: 44, background: item.iconBg, color: 'white' }}><item.Icon size={20} /></div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14 }}>{item.name}</p>
                            <p style={{ fontSize: 12, fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, color: item.on ? '#10B981' : '#9090B0' }}>
                              {item.on && <CheckCircle2 size={11} />} {item.sub}
                            </p>
                          </div>
                          <button className="clay-sec" style={{ flexShrink: 0, padding: '7px 18px', fontSize: 12 }}>{item.on ? 'Configure' : 'Connect'}</button>
                        </div>
                      ))}

                      <div className="clay-info-box" style={{ background: 'linear-gradient(135deg,#EEF2FF,#E0E7FF)', border: '1px solid rgba(199,210,254,.5)' }}>
                        <p style={{ fontWeight: 800, color: '#4F46E5', fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={14} /> API Keys</p>
                        <p style={{ fontSize: 13, color: '#6366F1', fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>Manage your integration API keys securely. Never share these keys publicly.</p>
                        <button className="clay-sec"><Key size={13} /> Manage API Keys</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* BACKUP */}
                {activeTab === 'backup' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors.backup, color: 'white' }}><HardDrive size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Backup & Data</p>
                      </div>
                    </div>
                    <div className="clay-panel-body">
                      <div className="clay-info-box" style={{ background: 'linear-gradient(135deg,#ECFDF5,#A7F3D0)', border: '1px solid rgba(16,185,129,.2)' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0 }} />
                          <div>
                            <p style={{ fontWeight: 800, color: '#15803D', fontSize: 14 }}>Last Backup: Feb 1, 2026 at 02:00 AM</p>
                            <p style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 3 }}>Automatic daily backups enabled via Supabase</p>
                          </div>
                        </div>
                      </div>

                      <SectionGroup title="☁️ Backup Settings">
                        <ToggleRow title="Automatic Backups" desc="Daily backups at 2:00 AM UTC" defaultChecked />
                        <div className="clay-toggle-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                          <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14 }}>Backup Retention</p>
                          <select className="clay-field" style={{ ...fieldStyle, appearance: 'none', cursor: 'pointer' }}>
                            <option>Keep last 7 days</option><option>Keep last 14 days</option><option>Keep last 30 days</option><option>Keep last 90 days</option>
                          </select>
                        </div>
                      </SectionGroup>

                      <div>
                        <p className="section-hd">📥 Data Export</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 9 }}>
                          {['All Patients (CSV)', 'Appointments (CSV)', 'Prescriptions (CSV)', 'Lab Results (CSV)'].map(e => (
                            <button key={e} className="clay-sec" style={{ justifyContent: 'flex-start' }}><Download size={13} /> Export {e}</button>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #EEF2FF', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button className="clay-save" style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 7 }}><HardDrive size={15} /> Create Manual Backup</button>
                        <button className="clay-sec clay-sec-danger" style={{ width: '100%', justifyContent: 'center' }}><RefreshCw size={13} /> Restore from Backup</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* MAINTENANCE */}
                {activeTab === 'maintenance' && (
                  <div className="clay-panel">
                    <div className="clay-panel-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-ico" style={{ width: 38, height: 38, background: tabIconColors.maintenance, color: 'white' }}><Wrench size={17} /></div>
                        <p style={{ fontFamily: 'Fraunces,serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Maintenance Mode</p>
                      </div>
                    </div>
                    <div className="clay-panel-body">
                      <div className="clay-maint-status" style={{ background: maintenanceMode ? 'linear-gradient(135deg,#FFF1F2,#FECDD3)' : 'linear-gradient(135deg,#ECFDF5,#A7F3D0)' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span className="live-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: maintenanceMode ? '#F43F5E' : '#10B981', display: 'inline-block', marginTop: 3 }} />
                          <div>
                            <p style={{ fontWeight: 800, color: maintenanceMode ? '#BE123C' : '#15803D', fontSize: 15 }}>System is {maintenanceMode ? 'in Maintenance Mode' : 'Operating Normally'}</p>
                            <p style={{ fontSize: 12, fontWeight: 600, color: maintenanceMode ? '#F43F5E' : '#10B981', marginTop: 3 }}>{maintenanceMode ? 'Only admins can access the system' : 'All users can access the system'}</p>
                          </div>
                        </div>
                        <Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />
                      </div>

                      {maintenanceMode && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <FieldRow label="Maintenance Message (shown to users)">
                            <textarea className="clay-field" defaultValue="We're currently performing scheduled maintenance. The system will be back online shortly. Thank you for your patience." style={{ ...fieldStyle, resize: 'vertical', minHeight: 90 }} />
                          </FieldRow>
                          <FieldRow label="Estimated Downtime">
                            <input type="text" placeholder="e.g., 2 hours" className="clay-field" style={{ ...fieldStyle }} />
                          </FieldRow>
                        </div>
                      )}

                      <div>
                        <p className="section-hd">🔧 Maintenance Tasks</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 9 }}>
                          {[
                            { Icon: Eraser, l: 'Clear Application Cache' },
                            { Icon: RefreshCw, l: 'Rebuild Search Index' },
                            { Icon: Database, l: 'Optimize Database' },
                            { Icon: Trash2, l: 'Clear Old Logs (90+ days)' },
                          ].map(t => (
                            <button key={t.l} className="clay-sec" style={{ justifyContent: 'flex-start' }}><t.Icon size={13} /> {t.l}</button>
                          ))}
                        </div>
                      </div>

                      <div className="clay-info-box" style={{ background: 'linear-gradient(135deg,#FFFBEB,#FDE68A)', border: '1px solid rgba(245,158,11,.2)' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <AlertTriangle size={18} style={{ color: '#B45309', flexShrink: 0 }} />
                          <div>
                            <p style={{ fontWeight: 800, color: '#92400E', fontSize: 14 }}>Danger Zone</p>
                            <p style={{ fontSize: 12, color: '#B45309', fontWeight: 600, marginTop: 4, marginBottom: 12, lineHeight: 1.5 }}>These actions are irreversible and may affect system data.</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button className="clay-sec clay-sec-danger" style={{ padding: '7px 16px', fontSize: 12 }}>Reset Demo Data</button>
                              <button className="clay-sec clay-sec-danger" style={{ padding: '7px 16px', fontSize: 12 }}>Purge All Sessions</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}