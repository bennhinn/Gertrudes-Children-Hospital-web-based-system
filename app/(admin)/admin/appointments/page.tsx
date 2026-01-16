'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

interface Appointment {
    id: string;
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

export default function AppointmentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const { data: appointments, error, isLoading, mutate } = useSWR<Appointment[]>('/api/admin/appointments', fetcher);

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

    // Stats
    const stats = {
        total: appointments?.length || 0,
        pending: appointments?.filter(a => a.status === 'pending').length || 0,
        confirmed: appointments?.filter(a => a.status === 'confirmed').length || 0,
        completed: appointments?.filter(a => a.status === 'completed').length || 0,
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
                <Button className="bg-linear-to-r from-green-500 to-emerald-600 text-white">
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
                                                    <Button variant="secondary" size="sm">View</Button>
                                                    <Button variant="secondary" size="sm">Edit</Button>
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
        </div>
    );
}

