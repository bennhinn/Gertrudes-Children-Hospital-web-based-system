'use client';

import React from 'react';
import { Calendar, Pencil } from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/ui/modal';
import { AppointmentStatusBadge, getStatus } from './AppointmentStatusBadge';
import type { Appointment, Child, Caregiver, Doctor } from '@/hooks/useAppointments';

// ─── Shared select style ──────────────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
    borderRadius: 14, border: '1.5px solid #C7D2FE',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,.07), inset 0 -1px 0 rgba(255,255,255,.8)',
    background: '#FAFBFF', fontWeight: 600, fontFamily: 'Nunito',
    padding: '9px 12px', width: '100%', cursor: 'pointer', fontSize: 14, color: '#1E1B4B',
    appearance: 'none' as const,
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label style={{ display: 'block' }}>
            <span className="clay-label">{label}</span>
            {children}
        </label>
    );
}

// ─── View Modal ───────────────────────────────────────────────────────────────
interface ViewModalProps {
    appointment: Appointment | null;
    onClose: () => void;
}

export function ViewAppointmentModal({ appointment, onClose }: ViewModalProps) {
    return (
        <Modal isOpen={!!appointment} onClose={onClose}>
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
                {appointment && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            { label: 'Child', value: appointment.child?.full_name || 'N/A' },
                            { label: 'Caregiver', value: appointment.caregiver?.profiles?.full_name || 'N/A' },
                            { label: 'Doctor', value: appointment.doctor?.profiles?.full_name || 'Not assigned' },
                            { label: 'Scheduled For', value: appointment.scheduled_for ? new Date(appointment.scheduled_for).toLocaleString() : 'N/A' },
                        ].map(row => (
                            <div key={row.label} className="clay-info-row">
                                <span className="clay-label" style={{ marginBottom: 4 }}>{row.label}</span>
                                <p style={{ fontWeight: 700, color: '#1E1B4B', fontSize: 15 }}>{row.value}</p>
                            </div>
                        ))}
                        <div className="clay-info-row">
                            <span className="clay-label" style={{ marginBottom: 6 }}>Status</span>
                            <AppointmentStatusBadge status={appointment.status} />
                        </div>
                        {appointment.notes && (
                            <div className="clay-info-row">
                                <span className="clay-label" style={{ marginBottom: 4 }}>Notes</span>
                                <p style={{ color: '#4C4C72', fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>{appointment.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </ModalContent>
            <ModalFooter>
                <button className="clay-modal-close" onClick={onClose}
                    style={{ padding: '10px 24px', fontSize: 14, fontFamily: 'Nunito' }}>
                    Close
                </button>
            </ModalFooter>
        </Modal>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
interface EditModalProps {
    appointment: Appointment | null;
    form: { child_id: string; caregiver_id: string; doctor_id: string; scheduled_for: string; status: string; notes: string };
    setForm: (form: EditModalProps['form']) => void;
    isSaving: boolean;
    onSave: () => void;
    onClose: () => void;
    children: Child[] | undefined;
    caregivers: Caregiver[] | undefined;
    doctors: Doctor[] | undefined;
}

export function EditAppointmentModal({ appointment, form, setForm, isSaving, onSave, onClose, children, caregivers, doctors }: EditModalProps) {
    return (
        <Modal isOpen={!!appointment} onClose={onClose}>
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
                <AppointmentFormFields form={form} setForm={setForm} childList={children} caregiverList={caregivers} doctorList={doctors} />
            </ModalContent>
            <ModalFooter>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="clay-modal-close" onClick={onClose}
                        style={{ padding: '10px 22px', fontSize: 14 }}>Cancel</button>
                    <button className="clay-modal-save" onClick={onSave} disabled={isSaving}
                        style={{ padding: '10px 26px', fontSize: 14, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                        {isSaving ? '⏳ Saving…' : '💾 Save Changes'}
                    </button>
                </div>
            </ModalFooter>
        </Modal>
    );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
interface AddModalProps {
    isOpen: boolean;
    form: { child_id: string; caregiver_id: string; doctor_id: string; scheduled_for: string; status: string; notes: string };
    setForm: (form: AddModalProps['form']) => void;
    isSaving: boolean;
    onSave: () => void;
    onClose: () => void;
    children: Child[] | undefined;
    caregivers: Caregiver[] | undefined;
    doctors: Doctor[] | undefined;
}

export function AddAppointmentModal({ isOpen, form, setForm, isSaving, onSave, onClose, children, caregivers, doctors }: AddModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
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
                <AppointmentFormFields form={form} setForm={setForm} childList={children} caregiverList={caregivers} doctorList={doctors} />
            </ModalContent>
            <ModalFooter>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="clay-modal-close" onClick={onClose}
                        style={{ padding: '10px 22px', fontSize: 14 }}>Cancel</button>
                    <button className="clay-modal-save" onClick={onSave} disabled={isSaving}
                        style={{ padding: '10px 26px', fontSize: 14, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                        {isSaving ? '⏳ Creating…' : '✅ Create Appointment'}
                    </button>
                </div>
            </ModalFooter>
        </Modal>
    );
}

// ─── Shared form fields ───────────────────────────────────────────────────────
interface FormFieldsProps {
    form: { child_id: string; caregiver_id: string; doctor_id: string; scheduled_for: string; status: string; notes: string };
    setForm: (form: FormFieldsProps['form']) => void;
    childList: Child[] | undefined;
    caregiverList: Caregiver[] | undefined;
    doctorList: Doctor[] | undefined;
}

function AppointmentFormFields({ form, setForm, childList, caregiverList, doctorList }: FormFieldsProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldRow label="Child">
                <select className="clay-field" value={form.child_id} onChange={e => setForm({ ...form, child_id: e.target.value })} style={selectStyle}>
                    <option value="">Select child</option>
                    {childList?.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
            </FieldRow>
            <FieldRow label="Caregiver">
                <select className="clay-field" value={form.caregiver_id} onChange={e => setForm({ ...form, caregiver_id: e.target.value })} style={selectStyle}>
                    <option value="">Select caregiver</option>
                    {caregiverList?.map(c => <option key={c.id} value={c.id}>{c.profiles.full_name}</option>)}
                </select>
            </FieldRow>
            <FieldRow label="Doctor">
                <select className="clay-field" value={form.doctor_id} onChange={e => setForm({ ...form, doctor_id: e.target.value })} style={selectStyle}>
                    <option value="">Select doctor</option>
                    {doctorList?.map(d => <option key={d.user_id} value={d.user_id}>{d.profiles.full_name}</option>)}
                </select>
            </FieldRow>
            <FieldRow label="Scheduled For">
                <input type="datetime-local" className="clay-field" value={form.scheduled_for}
                    onChange={e => setForm({ ...form, scheduled_for: e.target.value })}
                    style={{ ...selectStyle, borderRadius: 14 }} />
            </FieldRow>
            <FieldRow label="Status">
                <select className="clay-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={selectStyle}>
                    {['pending', 'confirmed', 'completed', 'cancelled', 'no-show'].map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
            </FieldRow>
            <FieldRow label="Notes">
                <textarea className="clay-field" value={form.notes} rows={3}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Optional notes…"
                    style={{ ...selectStyle, borderRadius: 14, resize: 'vertical', lineHeight: 1.5 }} />
            </FieldRow>
        </div>
    );
}
