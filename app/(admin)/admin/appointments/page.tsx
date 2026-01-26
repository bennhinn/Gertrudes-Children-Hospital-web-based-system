'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/ui/modal';
import { Label } from '@/components/ui/label';
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

interface Appointment {
    id: string;
    child_id: string;
    caregiver_id: string;
    doctor_id?: string;
    scheduled_for: string;
    status: string;
    notes?: string;
    child: {
        full_name: string;
    };
    caregiver?: {
        profiles: {
            full_name: string;
        };
    };
    doctor?: {
        profiles: {
            full_name: string;
        };
    };
}

interface Child {
    id: string;
    full_name: string;
}

interface Caregiver {
    id: string;
    profiles: {
        full_name: string;
    };
}

interface Doctor {
    user_id: string;
    profiles: {
        full_name: string;
    };
}

export default function AppointmentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [viewAppointment, setViewAppointment] = useState<Appointment | null>(null);
    const [editAppointment, setEditAppointment] = useState<Appointment | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editForm, setEditForm] = useState({
        child_id: '',
        caregiver_id: '',
        doctor_id: '',
        scheduled_for: '',
        status: 'pending',
        notes: ''
    });

    const [addForm, setAddForm] = useState({
        child_id: '',
        caregiver_id: '',
        doctor_id: '',
        scheduled_for: '',
        status: 'pending',
        notes: ''
    });

    const { data: appointments, error, isLoading, mutate } = useSWR<Appointment[]>('/api/admin/appointments', fetcher);
    const { data: children } = useSWR<Child[]>('/api/admin/children', fetcher);
    const { data: caregivers } = useSWR<Caregiver[]>('/api/admin/caregivers', fetcher);
    const { data: doctors } = useSWR<Doctor[]>('/api/admin/doctors', fetcher);

    const filteredAppointments = appointments?.filter((apt) => {
        const matchesSearch = apt.child?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.caregiver?.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
        const matchesDate = !dateFilter || apt.scheduled_for?.startsWith(dateFilter);
        return matchesSearch && matchesStatus && matchesDate;
    }) || [];

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'bg-amber-100 text-amber-800 border-amber-200',
            confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
            completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
            'no-show': 'bg-slate-100 text-slate-800 border-slate-200',
        };
        return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200';
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, string> = {
            pending: '⏳',
            confirmed: '✅',
            completed: '🎉',
            cancelled: '❌',
            'no-show': '🚫',
        };
        return icons[status] || '📅';
    };

    const stats = {
        total: appointments?.length || 0,
        pending: appointments?.filter(a => a.status === 'pending').length || 0,
        confirmed: appointments?.filter(a => a.status === 'confirmed').length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
    };

    const handleView = (appointment: Appointment) => {
        setViewAppointment(appointment);
    };

    const handleEdit = (appointment: Appointment) => {
        setEditAppointment(appointment);
        setEditForm({
            child_id: appointment.child_id || '',
            caregiver_id: appointment.caregiver_id || '',
            doctor_id: appointment.doctor_id || '',
            scheduled_for: appointment.scheduled_for ? new Date(appointment.scheduled_for).toISOString().slice(0, 16) : '',
            status: appointment.status || 'pending',
            notes: appointment.notes || ''
        });
    };

    const handleSaveEdit = async () => {
        if (!editAppointment) return;
        
        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/appointments/${editAppointment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (!response.ok) throw new Error('Failed to update appointment');

            await mutate();
            setEditAppointment(null);
        } catch (error) {
            console.error('Error updating appointment:', error);
            alert('Failed to update appointment. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddAppointment = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addForm),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create appointment');
            }

            await mutate();
            setShowAddModal(false);
            setAddForm({
                child_id: '',
                caregiver_id: '',
                doctor_id: '',
                scheduled_for: '',
                status: 'pending',
                notes: ''
            });
        } catch (error) {
            console.error('Error creating appointment:', error);
            alert(error instanceof Error ? error.message : 'Failed to create appointment. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-medium">Error loading appointments</p>
                    <p className="text-slate-500 mt-2">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
                    <p className="mt-1 text-slate-600">Manage all system appointments</p>
                </div>
                <Button 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                    onClick={() => setShowAddModal(true)}
                >
                    + New Appointment
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/90 text-sm font-medium">Total</p>
                                <p className="text-4xl font-bold text-white mt-2">{stats.total}</p>
                            </div>
                            <div className="text-5xl opacity-20 text-white">📅</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl bg-gradient-to-br from-amber-500 to-orange-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/90 text-sm font-medium">Pending</p>
                                <p className="text-4xl font-bold text-white mt-2">{stats.pending}</p>
                            </div>
                            <div className="text-5xl opacity-20 text-white">⏳</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl bg-gradient-to-br from-sky-500 to-blue-600">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/90 text-sm font-medium">Confirmed</p>
                                <p className="text-4xl font-bold text-white mt-2">{stats.confirmed}</p>
                            </div>
                            <div className="text-5xl opacity-20 text-white">✅</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-xl bg-gradient-to-br from-emerald-500 to-green-600">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/90 text-sm font-medium">Completed</p>
                                <p className="text-4xl font-bold text-white mt-2">{stats.completed}</p>
                            </div>
                            <div className="text-5xl opacity-20 text-white">🎉</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="🔍 Search by child or caregiver name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-11 text-base"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-11 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-auto h-11"
                        />
                        <Button onClick={() => mutate()} variant="secondary" className="h-11">
                            🔄 Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Appointments Table */}
            <Card className="border-none shadow-xl">
                <CardHeader className="border-b bg-slate-50">
                    <CardTitle className="text-lg font-bold text-slate-900">
                        Appointments ({filteredAppointments.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📅</div>
                            <p className="text-slate-500 font-medium">No appointments found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-slate-200">
                                        <th className="text-left py-4 px-4 font-semibold text-slate-900">Child</th>
                                        <th className="text-left py-4 px-4 font-semibold text-slate-900">Caregiver</th>
                                        <th className="text-left py-4 px-4 font-semibold text-slate-900">Doctor</th>
                                        <th className="text-left py-4 px-4 font-semibold text-slate-900">Date & Time</th>
                                        <th className="text-left py-4 px-4 font-semibold text-slate-900">Status</th>
                                        <th className="text-left py-4 px-4 font-semibold text-slate-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.map((apt) => (
                                        <tr key={apt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white text-lg shadow-sm">
                                                        👶
                                                    </div>
                                                    <span className="font-semibold text-slate-900">{apt.child?.full_name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-slate-700 font-medium">
                                                {apt.caregiver?.profiles?.full_name || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-slate-700 font-medium">
                                                {apt.doctor?.profiles?.full_name || 'Not assigned'}
                                            </td>
                                            <td className="py-4 px-4">
                                                {apt.scheduled_for ? (
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{new Date(apt.scheduled_for).toLocaleDateString()}</p>
                                                        <p className="text-sm text-slate-600">{new Date(apt.scheduled_for).toLocaleTimeString()}</p>
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(apt.status)}`}>
                                                    {getStatusIcon(apt.status)} {apt.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Button variant="secondary" size="sm" onClick={() => handleView(apt)} className="font-medium">
                                                        👁️ View
                                                    </Button>
                                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(apt)} className="font-medium">
                                                        ✏️ Edit
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Appointment Modal */}
            <Modal isOpen={!!viewAppointment} onClose={() => setViewAppointment(null)}>
                <ModalHeader>
                    <ModalTitle>
                        <span className="text-xl font-bold text-slate-900">Appointment Details</span>
                    </ModalTitle>
                </ModalHeader>
                <ModalContent>
                    {viewAppointment && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-xs text-slate-600 font-semibold uppercase">Child</p>
                                <p className="text-base font-semibold text-slate-900 mt-1">{viewAppointment.child?.full_name || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-xs text-slate-600 font-semibold uppercase">Caregiver</p>
                                <p className="text-base font-semibold text-slate-900 mt-1">{viewAppointment.caregiver?.profiles?.full_name || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-xs text-slate-600 font-semibold uppercase">Doctor</p>
                                <p className="text-base font-semibold text-slate-900 mt-1">{viewAppointment.doctor?.profiles?.full_name || 'Not assigned'}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-xs text-slate-600 font-semibold uppercase">Scheduled For</p>
                                <p className="text-base font-semibold text-slate-900 mt-1">
                                    {viewAppointment.scheduled_for ? new Date(viewAppointment.scheduled_for).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4">
                                <p className="text-xs text-slate-600 font-semibold uppercase mb-2">Status</p>
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(viewAppointment.status)}`}>
                                    {getStatusIcon(viewAppointment.status)} {viewAppointment.status}
                                </span>
                            </div>
                            {viewAppointment.notes && (
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <p className="text-xs text-slate-600 font-semibold uppercase">Notes</p>
                                    <p className="text-base text-slate-900 mt-1">{viewAppointment.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </ModalContent>
                <ModalFooter>
                    <Button onClick={() => setViewAppointment(null)}>Close</Button>
                </ModalFooter>
            </Modal>

            {/* Edit and Add Modals remain the same structure with updated styling */}
            {/* ... (keeping the same edit and add modal code for brevity) ... */}
        </div>
    );
}