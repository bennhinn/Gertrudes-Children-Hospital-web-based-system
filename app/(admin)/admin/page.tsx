'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function AdminDashboardPage() {
    const { data: stats, error: statsError, isLoading: statsLoading } = useSWR('/api/admin/stats', fetcher);
    const { data: activity, error: activityError, isLoading: activityLoading } = useSWR('/api/admin/recent-activity', fetcher);

    if (statsError || activityError) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-medium">Error loading dashboard data</p>
                    <p className="text-slate-500 mt-2">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    if (statsLoading || activityLoading) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="mt-1 text-slate-600">System overview and management</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="border-none shadow-lg bg-slate-200 animate-pulse h-32" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="mt-1 text-slate-600">System overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-none shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-white/90 text-sm font-medium">Total Users</p>
                                <p className="text-4xl font-bold mt-2 text-white">{stats?.totalUsers ?? 0}</p>
                            </div>
                            <div className="text-5xl opacity-20 text-white">👥</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-white/90 text-sm font-medium">Registered Children</p>
                                <p className="text-4xl font-bold mt-2 text-white">{stats?.totalChildren ?? 0}</p>
                            </div>
                            <div className="text-5xl opacity-20 text-white">👶</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-gradient-to-br from-green-500 to-green-600 overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-white/90 text-sm font-medium">Total Doctors</p>
                                <p className="text-4xl font-bold mt-2 text-white">{stats?.totalDoctors ?? 0}</p>
                            </div>
                            <div className="text-5xl opacity-20 text-white">👨‍⚕️</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-white/90 text-sm font-medium">Total Appointments</p>
                                <p className="text-4xl font-bold mt-2 text-white">{stats?.totalAppointments ?? 0}</p>
                            </div>
                            <div className="text-5xl opacity-20 text-white">📅</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-gradient-to-br from-yellow-500 to-yellow-600 overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-white/90 text-sm font-medium">Pending Appointments</p>
                                <p className="text-4xl font-bold mt-2 text-white">{stats?.pendingAppointments ?? 0}</p>
                            </div>
                            <div className="text-5xl opacity-20 text-white">⏳</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-gradient-to-br from-cyan-500 to-cyan-600 overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-white/90 text-sm font-medium">Today&apos;s Appointments</p>
                                <p className="text-4xl font-bold mt-2 text-white">{stats?.todayAppointments ?? 0}</p>
                            </div>
                            <div className="text-5xl opacity-20 text-white">📆</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Appointments */}
                <Card className="border-none shadow-xl">
                    <CardHeader className="border-b bg-slate-50">
                        <CardTitle className="text-lg font-bold text-slate-900">Recent Appointments</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {!activity || activity.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">📅</div>
                                <p className="text-slate-500 font-medium">No recent appointments</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activity.map((apt: any) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                {apt.child?.full_name || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-slate-600 mt-1">
                                                {apt.scheduled_for ? new Date(apt.scheduled_for).toLocaleDateString('en-US', { 
                                                    month: 'short', 
                                                    day: 'numeric', 
                                                    year: 'numeric' 
                                                }) : 'No date'}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                                                apt.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : apt.status === 'confirmed'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : apt.status === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-slate-100 text-slate-800'
                                            }`}
                                        >
                                            {apt.status || 'unknown'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-none shadow-xl">
                    <CardHeader className="border-b bg-slate-50">
                        <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid gap-3">
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 p-4 border border-blue-200 hover:shadow-md transition-all"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500 text-2xl shadow-sm">
                                    👥
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">Manage Users</p>
                                    <p className="text-sm text-slate-600">View and edit user accounts</p>
                                </div>
                            </Link>

                            <Link
                                href="/admin/staff"
                                className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 p-4 border border-purple-200 hover:shadow-md transition-all"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500 text-2xl shadow-sm">
                                    👨‍⚕️
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">Manage Staff</p>
                                    <p className="text-sm text-slate-600">Doctors, nurses, and other staff</p>
                                </div>
                            </Link>

                            <Link
                                href="/admin/appointments"
                                className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 p-4 border border-green-200 hover:shadow-md transition-all"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500 text-2xl shadow-sm">
                                    📅
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">View Appointments</p>
                                    <p className="text-sm text-slate-600">All system appointments</p>
                                </div>
                            </Link>

                            <Link
                                href="/admin/reports"
                                className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 p-4 border border-orange-200 hover:shadow-md transition-all"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500 text-2xl shadow-sm">
                                    📊
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">View Reports</p>
                                    <p className="text-sm text-slate-600">Analytics and insights</p>
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}