'use client';

import { useState } from 'react';
import { Calendar, Clock, CheckCircle2, PartyPopper } from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import type { Appointment } from '@/hooks/useAppointments';
import { AppointmentFilters, AppointmentsTable } from '@/components/appointments';
import { ViewAppointmentModal, EditAppointmentModal, AddAppointmentModal } from '@/components/appointments';
import './clay-appointments.css';

export default function AppointmentsPage() {
    const {
        appointments, stats, error, isLoading, mutate,
        children, caregivers, doctors,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        dateFilter, setDateFilter,
    } = useAppointments();

    const [viewAppointment, setViewAppointment] = useState<Appointment | null>(null);
    const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editForm, setEditForm] = useState({ child_id: '', caregiver_id: '', doctor_id: '', scheduled_for: '', status: 'pending', notes: '' });
    const [addForm, setAddForm] = useState({ child_id: '', caregiver_id: '', doctor_id: '', scheduled_for: '', status: 'pending', notes: '' });

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
            <div role="alert" className="clay-stat" style={{ background: '#FFF1F2', padding: '32px 40px', textAlign: 'center' }}>
                <p style={{ color: '#F43F5E', fontSize: 18, fontWeight: 800, fontFamily: 'Nunito' }}>Error loading appointments</p>
                <p style={{ color: '#9090B0', marginTop: 8, fontFamily: 'Nunito' }}>Please try refreshing the page</p>
            </div>
        </div>
    );

    return (
        <div className="clay-page" style={{ background: 'var(--clay-bg)', minHeight: '100vh', padding: '0 0 48px', position: 'relative' }}>
            {/* Decorative blobs */}
            <div className="deco-blob" style={{ width: 360, height: 360, background: 'radial-gradient(circle,rgba(99,102,241,.07),transparent 70%)', top: -80, right: -80, position: 'fixed' }} />
            <div className="deco-blob" style={{ width: 260, height: 260, background: 'radial-gradient(circle,rgba(16,185,129,.06),transparent 70%)', bottom: 120, left: -60, position: 'fixed', animationDelay: '3.5s' }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
                {/* Page Header */}
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
                        aria-label="Create new appointment"
                        style={{ padding: '12px 26px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                        <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Appointment
                    </button>
                </div>

                {/* Stat Cards */}
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
                                    <p style={{ fontSize: 11, fontWeight: 800, color: s.tc, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</p>
                                    <p style={{ fontFamily: 'Fraunces, serif', fontSize: 40, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, marginTop: 4 }}>{s.value}</p>
                                </div>
                                <div className="clay-ico" style={{ width: 44, height: 44, background: s.iconBg, color: 'white' }}>
                                    <s.Icon size={20} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <AppointmentFilters
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    dateFilter={dateFilter} setDateFilter={setDateFilter}
                    mutate={mutate}
                />

                {/* Table / Card List */}
                <AppointmentsTable
                    appointments={appointments}
                    isLoading={isLoading}
                    onView={setViewAppointment}
                    onEdit={handleEdit}
                />

                {/* Modals */}
                <ViewAppointmentModal appointment={viewAppointment} onClose={() => setViewAppointment(null)} />
                <EditAppointmentModal
                    appointment={editAppointment} form={editForm} setForm={setEditForm}
                    isSaving={isSaving} onSave={handleSaveEdit} onClose={() => setEditAppointment(null)}
                    children={children} caregivers={caregivers} doctors={doctors}
                />
                <AddAppointmentModal
                    isOpen={showAddModal} form={addForm} setForm={setAddForm}
                    isSaving={isSaving} onSave={handleAddAppointment} onClose={() => setShowAddModal(false)}
                    children={children} caregivers={caregivers} doctors={doctors}
                />
            </div>
        </div>
    );
}