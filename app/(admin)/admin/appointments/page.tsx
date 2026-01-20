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
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            'no-show': 'bg-slate-100 text-slate-800',
        };
        return colors[status] || 'bg-slate-100 text-slate-800';
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
            <div className="flex items-center justify-center min-h-100">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-medium">Error loading appointments</p>
                    <p className="text-slate-500 mt-2">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Appointments</h1>
                    <p className="mt-1 text-slate-600">Manage all system appointments</p>
                </div>
                <Button 
                    className="bg-linear-to-r from-green-500 to-emerald-600 text-white"
                    onClick={() => setShowAddModal(true)}
                >
                    + New Appointment
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-none shadow-md bg-linear-to-br from-slate-500 to-slate-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-200 text-sm">Total</p>
                                <p className="text-3xl font-bold">{stats.total}</p>
                            </div>
                            <span className="text-3xl opacity-80">📅</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-linear-to-br from-yellow-500 to-yellow-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-100 text-sm">Pending</p>
                                <p className="text-3xl font-bold">{stats.pending}</p>
                            </div>
                            <span className="text-3xl opacity-80">⏳</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-linear-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Confirmed</p>
                                <p className="text-3xl font-bold">{stats.confirmed}</p>
                            </div>
                            <span className="text-3xl opacity-80">✅</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-linear-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Completed</p>
                                <p className="text-3xl font-bold">{stats.completed}</p>
                            </div>
                            <span className="text-3xl opacity-80">🎉</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by child or caregiver name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-auto"
                        />
                        <Button onClick={() => mutate()} variant="secondary">
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Appointments Table */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle>Appointments ({filteredAppointments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No appointments found</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Child</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Caregiver</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Doctor</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Date & Time</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.map((apt) => (
                                        <tr key={apt.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-sm font-medium">
                                                        👶
                                                    </div>
                                                    <span className="font-medium text-slate-800">{apt.child?.full_name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-slate-600">
                                                {apt.caregiver?.profiles?.full_name || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-slate-600">
                                                {apt.doctor?.profiles?.full_name || 'Not assigned'}
                                            </td>
                                            <td className="py-4 px-4 text-slate-600">
                                                {apt.scheduled_for ? (
                                                    <div>
                                                        <p className="font-medium">{new Date(apt.scheduled_for).toLocaleDateString()}</p>
                                                        <p className="text-xs text-slate-500">{new Date(apt.scheduled_for).toLocaleTimeString()}</p>
                                                    </div>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(apt.status)}`}>
                                                    {getStatusIcon(apt.status)} {apt.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Button variant="secondary" size="sm" onClick={() => handleView(apt)}>View</Button>
                                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(apt)}>Edit</Button>
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
                    <ModalTitle>Appointment Details</ModalTitle>
                </ModalHeader>
                <ModalContent>
                    {viewAppointment && (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Child</p>
                                <p className="text-sm font-medium text-slate-800 mt-1">{viewAppointment.child?.full_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Caregiver</p>
                                <p className="text-sm font-medium text-slate-800 mt-1">{viewAppointment.caregiver?.profiles?.full_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Doctor</p>
                                <p className="text-sm font-medium text-slate-800 mt-1">{viewAppointment.doctor?.profiles?.full_name || 'Not assigned'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Scheduled For</p>
                                <p className="text-sm font-medium text-slate-800 mt-1">
                                    {viewAppointment.scheduled_for ? new Date(viewAppointment.scheduled_for).toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Status</p>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(viewAppointment.status)}`}>
                                        {getStatusIcon(viewAppointment.status)} {viewAppointment.status}
                                    </span>
                                </div>
                            </div>
                            {viewAppointment.notes && (
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Notes</p>
                                    <p className="text-sm text-slate-800 mt-1">{viewAppointment.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </ModalContent>
                <ModalFooter>
                    <Button onClick={() => setViewAppointment(null)}>Close</Button>
                </ModalFooter>
            </Modal>

            {/* Edit Appointment Modal */}
            <Modal isOpen={!!editAppointment} onClose={() => setEditAppointment(null)}>
                <ModalHeader>
                    <ModalTitle>Edit Appointment</ModalTitle>
                </ModalHeader>
                <ModalContent>
                    <div>
                        <Label htmlFor="edit-child">Child *</Label>
                        <select
                            id="edit-child"
                            value={editForm.child_id}
                            onChange={(e) => setEditForm({ ...editForm, child_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select child</option>
                            {children?.map((child) => (
                                <option key={child.id} value={child.id}>{child.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="edit-caregiver">Caregiver *</Label>
                        <select
                            id="edit-caregiver"
                            value={editForm.caregiver_id}
                            onChange={(e) => setEditForm({ ...editForm, caregiver_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select caregiver</option>
                            {caregivers?.map((caregiver) => (
                                <option key={caregiver.id} value={caregiver.id}>{caregiver.profiles.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="edit-doctor">Doctor</Label>
                        <select
                            id="edit-doctor"
                            value={editForm.doctor_id}
                            onChange={(e) => setEditForm({ ...editForm, doctor_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select doctor</option>
                            {doctors?.map((doctor) => (
                                <option key={doctor.user_id} value={doctor.user_id}>{doctor.profiles.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="edit-datetime">Date & Time *</Label>
                        <Input
                            id="edit-datetime"
                            type="datetime-local"
                            value={editForm.scheduled_for}
                            onChange={(e) => setEditForm({ ...editForm, scheduled_for: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="edit-status">Status</Label>
                        <select
                            id="edit-status"
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no-show">No Show</option>
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="edit-notes">Notes</Label>
                        <textarea
                            id="edit-notes"
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Additional notes..."
                        />
                    </div>
                </ModalContent>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setEditAppointment(null)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Add Appointment Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
                <ModalHeader>
                    <ModalTitle>New Appointment</ModalTitle>
                </ModalHeader>
                <ModalContent>
                    <div>
                        <Label htmlFor="add-child">Child *</Label>
                        <select
                            id="add-child"
                            value={addForm.child_id}
                            onChange={(e) => setAddForm({ ...addForm, child_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select child</option>
                            {children?.map((child) => (
                                <option key={child.id} value={child.id}>{child.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="add-caregiver">Caregiver *</Label>
                        <select
                            id="add-caregiver"
                            value={addForm.caregiver_id}
                            onChange={(e) => setAddForm({ ...addForm, caregiver_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select caregiver</option>
                            {caregivers?.map((caregiver) => (
                                <option key={caregiver.id} value={caregiver.id}>{caregiver.profiles.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="add-doctor">Doctor</Label>
                        <select
                            id="add-doctor"
                            value={addForm.doctor_id}
                            onChange={(e) => setAddForm({ ...addForm, doctor_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select doctor (optional)</option>
                            {doctors?.map((doctor) => (
                                <option key={doctor.user_id} value={doctor.user_id}>{doctor.profiles.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="add-datetime">Date & Time *</Label>
                        <Input
                            id="add-datetime"
                            type="datetime-local"
                            value={addForm.scheduled_for}
                            onChange={(e) => setAddForm({ ...addForm, scheduled_for: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="add-status">Status</Label>
                        <select
                            id="add-status"
                            value={addForm.status}
                            onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="add-notes">Notes</Label>
                        <textarea
                            id="add-notes"
                            value={addForm.notes}
                            onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Additional notes..."
                        />
                    </div>
                </ModalContent>
                <ModalFooter>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleAddAppointment} disabled={isSaving}>
                        {isSaving ? 'Creating...' : 'Create Appointment'}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}