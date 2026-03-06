'use client';

import { Calendar, Eye, Pencil, Baby } from 'lucide-react';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';
import type { Appointment } from '@/hooks/useAppointments';

interface AppointmentsTableProps {
    appointments: Appointment[];
    isLoading: boolean;
    onView: (apt: Appointment) => void;
    onEdit: (apt: Appointment) => void;
}

export function AppointmentsTable({ appointments, isLoading, onView, onEdit }: AppointmentsTableProps) {
    return (
        <div className="clay-card">
            {/* Table header */}
            <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid #EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <p style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Appointments</p>
                    <span style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 800, boxShadow: '0 2px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.7)' }}>
                        {appointments.length}
                    </span>
                </div>
            </div>

            <div style={{ padding: '16px' }}>
                {isLoading ? (
                    <div role="status" aria-label="Loading appointments" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="shimmer" style={{ height: 64 }} />)}
                    </div>
                ) : appointments.length === 0 ? (
                    <div role="status" style={{ textAlign: 'center', padding: '48px 0' }}>
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
                                        <th key={h} scope="col" style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.map((apt) => (
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
                                                <AppointmentStatusBadge status={apt.status} />
                                            </td>
                                            <td style={{ padding: '14px 16px' }}>
                                                <div style={{ display: 'flex', gap: 7 }}>
                                                    <button className="clay-btn-sec" onClick={() => onView(apt)}
                                                        aria-label={`View appointment for ${apt.child?.full_name || 'Unknown'}`}
                                                        style={{ padding: '6px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#4C4C72' }}>
                                                        <Eye size={13} /> View
                                                    </button>
                                                    <button className="clay-btn-sec" onClick={() => onEdit(apt)}
                                                        aria-label={`Edit appointment for ${apt.child?.full_name || 'Unknown'}`}
                                                        style={{ padding: '6px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#4C4C72' }}>
                                                        <Pencil size={13} /> Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile + fallback card list */}
                        <div className="mobile-card-list">
                            {appointments.map((apt) => (
                                <div key={apt.id} className="clay-mob-card" style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <div className="clay-avatar" style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                                            <Baby size={18} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{apt.child?.full_name || 'Unknown'}</p>
                                                    <p style={{ fontSize: 12, color: '#9090B0', fontWeight: 600, marginTop: 1 }}>{apt.caregiver?.profiles?.full_name || 'No caregiver'}</p>
                                                </div>
                                                <AppointmentStatusBadge status={apt.status} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
                                                <div style={{ fontSize: 12, color: '#4C4C72', fontWeight: 600 }}>
                                                    {apt.scheduled_for ? (
                                                        <span>📅 {new Date(apt.scheduled_for).toLocaleDateString()} · {new Date(apt.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    ) : 'No date set'}
                                                </div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="clay-btn-sec" onClick={() => onView(apt)}
                                                        aria-label={`View appointment for ${apt.child?.full_name || 'Unknown'}`}
                                                        style={{ padding: '5px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#6366F1' }}>
                                                        <Eye size={11} /> View
                                                    </button>
                                                    <button className="clay-btn-sec" onClick={() => onEdit(apt)}
                                                        aria-label={`Edit appointment for ${apt.child?.full_name || 'Unknown'}`}
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
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
