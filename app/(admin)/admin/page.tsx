'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useSWR from 'swr';
import Link from 'next/link';
import {
    Users,
    Baby,
    Stethoscope,
    Calendar,
    Clock,
    CalendarCheck,
    UserCog,
    FileBarChart,
    ArrowRight,
    TrendingUp,
    Activity
} from 'lucide-react';

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
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                        <Activity className="h-8 w-8 text-red-500" />
                    </div>
                    <div>
                        <p className="text-red-600 text-lg font-semibold">Error loading dashboard data</p>
                        <p className="text-slate-500 mt-1">Please try refreshing the page</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (statsLoading || activityLoading) {
        return (
            <div className="space-y-8">
                <div>
                    <div className="h-9 w-56 bg-slate-200 rounded-lg animate-pulse"></div>
                    <div className="h-5 w-40 bg-slate-100 rounded-lg animate-pulse mt-2"></div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="border border-slate-100 shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3">
                                        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
                                        <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
                                    </div>
                                    <div className="h-12 w-12 bg-slate-100 rounded-xl animate-pulse"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Live Dashboard</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="mt-1 text-slate-500">System overview and management</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Last updated: just now
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
                {/* Total Users */}
                <Card className="group border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300 bg-white overflow-hidden">
                    <CardContent className="p-5 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs sm:text-sm font-medium">Total Users</p>
                                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.totalUsers ?? 0}</p>
                                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Active accounts
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Registered Children */}
                <Card className="group border border-slate-100 shadow-sm hover:shadow-lg hover:border-purple-100 transition-all duration-300 bg-white overflow-hidden">
                    <CardContent className="p-5 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs sm:text-sm font-medium">Registered Children</p>
                                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.totalChildren ?? 0}</p>
                                <p className="text-xs text-purple-600 font-medium flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Patient records
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                                <Baby className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Doctors */}
                <Card className="group border border-slate-100 shadow-sm hover:shadow-lg hover:border-emerald-100 transition-all duration-300 bg-white overflow-hidden">
                    <CardContent className="p-5 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs sm:text-sm font-medium">Total Doctors</p>
                                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.totalDoctors ?? 0}</p>
                                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Medical staff
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Appointments */}
                <Card className="group border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-100 transition-all duration-300 bg-white overflow-hidden">
                    <CardContent className="p-5 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs sm:text-sm font-medium">Total Appointments</p>
                                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.totalAppointments ?? 0}</p>
                                <p className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    All time
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
                                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Appointments */}
                <Card className="group border border-slate-100 shadow-sm hover:shadow-lg hover:border-amber-100 transition-all duration-300 bg-white overflow-hidden">
                    <CardContent className="p-5 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs sm:text-sm font-medium">Pending Appointments</p>
                                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.pendingAppointments ?? 0}</p>
                                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Awaiting action
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                                <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Appointments */}
                <Card className="group border border-slate-100 shadow-sm hover:shadow-lg hover:border-cyan-100 transition-all duration-300 bg-white overflow-hidden">
                    <CardContent className="p-5 sm:p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-slate-500 text-xs sm:text-sm font-medium">Today&apos;s Appointments</p>
                                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.todayAppointments ?? 0}</p>
                                <p className="text-xs text-cyan-600 font-medium flex items-center gap-1">
                                    <CalendarCheck className="h-3 w-3" />
                                    Scheduled today
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-cyan-50 text-cyan-600 group-hover:bg-cyan-100 transition-colors">
                                <CalendarCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Appointments */}
                <Card className="border border-slate-100 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-indigo-600" />
                                Recent Appointments
                            </CardTitle>
                            <Link href="/admin/appointments" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                View all <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        {!activity || activity.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                    <Calendar className="h-7 w-7 text-slate-400" />
                                </div>
                                <p className="text-slate-500 font-medium">No recent appointments</p>
                                <p className="text-xs text-slate-400 mt-1">Appointments will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activity.map((apt: any) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                                                {(apt.child?.full_name || 'U')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 text-sm">
                                                    {apt.child?.full_name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {apt.scheduled_for ? new Date(apt.scheduled_for).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    }) : 'No date'}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${apt.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
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
                <Card className="border border-slate-100 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-indigo-600" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <div className="grid gap-3">
                            <Link
                                href="/admin/users"
                                className="group flex items-center gap-4 rounded-xl bg-white p-4 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900 text-sm">Manage Users</p>
                                    <p className="text-xs text-slate-500">View and edit user accounts</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                href="/admin/staff"
                                className="group flex items-center gap-4 rounded-xl bg-white p-4 border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                                    <UserCog className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900 text-sm">Manage Staff</p>
                                    <p className="text-xs text-slate-500">Doctors, nurses, and other staff</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                href="/admin/appointments"
                                className="group flex items-center gap-4 rounded-xl bg-white p-4 border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                    <CalendarCheck className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900 text-sm">View Appointments</p>
                                    <p className="text-xs text-slate-500">All system appointments</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <Link
                                href="/admin/reports"
                                className="group flex items-center gap-4 rounded-xl bg-white p-4 border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
                                    <FileBarChart className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-slate-900 text-sm">View Reports</p>
                                    <p className="text-xs text-slate-500">Analytics and insights</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}