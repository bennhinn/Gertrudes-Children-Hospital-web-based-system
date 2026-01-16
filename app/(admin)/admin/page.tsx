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
            <div className="flex items-center justify-center min-h-100">
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
                    <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
                    <p className="mt-1 text-slate-600">System overview and management</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="border-none shadow-lg bg-slate-200 animate-pulse h-28" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
                <p className="mt-1 text-slate-600">System overview and management</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-none shadow-lg bg-linear-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm">Total Users</p>
                                <p className="text-3xl font-bold mt-1">{stats?.totalUsers ?? 0}</p>
                            </div>
                            <div className="text-4xl opacity-80">👥</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-linear-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm">Registered Children</p>
                                <p className="text-3xl font-bold mt-1">{stats?.totalChildren ?? 0}</p>
                            </div>
                            <div className="text-4xl opacity-80">👶</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-linear-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm">Total Doctors</p>
                                <p className="text-3xl font-bold mt-1">{stats?.totalDoctors ?? 0}</p>
                            </div>
                            <div className="text-4xl opacity-80">👨‍⚕️</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-linear-to-br from-orange-500 to-orange-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-orange-100 text-sm">Total Appointments</p>
                                <p className="text-3xl font-bold mt-1">{stats?.totalAppointments ?? 0}</p>
                            </div>
                            <div className="text-4xl opacity-80">📅</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-linear-to-br from-yellow-500 to-yellow-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-100 text-sm">Pending Appointments</p>
                                <p className="text-3xl font-bold mt-1">{stats?.pendingAppointments ?? 0}</p>
                            </div>
                            <div className="text-4xl opacity-80">⏳</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-linear-to-br from-cyan-500 to-cyan-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-cyan-100 text-sm">Today&apos;s Appointments</p>
                                <p className="text-3xl font-bold mt-1">{stats?.todayAppointments ?? 0}</p>
                            </div>
                            <div className="text-4xl opacity-80">📆</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Appointments */}
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle>Recent Appointments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!activity || activity.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No recent appointments</p>
                        ) : (
                            <div className="space-y-3">
                                {activity.map((apt: any) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between rounded-lg bg-slate-50 p-4"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-800">
                                                {apt.child?.full_name || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {apt.scheduled_for ? new Date(apt.scheduled_for).toLocaleDateString() : 'No date'}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${apt.status === 'pending'
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
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3">
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-4 rounded-lg bg-linear-to-r from-blue-50 to-blue-100 p-4 hover:from-blue-100 hover:to-blue-200 transition-colors"
                            >
                                <span className="text-2xl">👥</span>
                                <div>
                                    <p className="font-medium text-slate-800">Manage Users</p>
                                    <p className="text-sm text-slate-600">View and edit user accounts</p>
                                </div>
                            </Link>

                            <Link
                                href="/admin/staff"
                                className="flex items-center gap-4 rounded-lg bg-linear-to-r from-purple-50 to-purple-100 p-4 hover:from-purple-100 hover:to-purple-200 transition-colors"
                            >
                                <span className="text-2xl">👨‍⚕️</span>
                                <div>
                                    <p className="font-medium text-slate-800">Manage Staff</p>
                                    <p className="text-sm text-slate-600">Doctors, nurses, and other staff</p>
                                </div>
                            </Link>

                            <Link
                                href="/admin/appointments"
                                className="flex items-center gap-4 rounded-lg bg-linear-to-r from-green-50 to-green-100 p-4 hover:from-green-100 hover:to-green-200 transition-colors"
                            >
                                <span className="text-2xl">📅</span>
                                <div>
                                    <p className="font-medium text-slate-800">View Appointments</p>
                                    <p className="text-sm text-slate-600">All system appointments</p>
                                </div>
                            </Link>

                            <Link
                                href="/settings"
                                className="flex items-center gap-4 rounded-lg bg-linear-to-r from-slate-50 to-slate-100 p-4 hover:from-slate-100 hover:to-slate-200 transition-colors"
                            >
                                <span className="text-2xl">⚙️</span>
                                <div>
                                    <p className="font-medium text-slate-800">System Settings</p>
                                    <p className="text-sm text-slate-600">Configure system preferences</p>
                                </div>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

