'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

interface ReportViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportType: string;
    reportTitle: string;
    period: string;
}

function ReportViewModal({ isOpen, onClose, reportType, reportTitle, period }: ReportViewModalProps) {
    const { data, error, isLoading } = useSWR(
        isOpen ? `/api/admin/reports/${reportType}?period=${period}&format=json` : null,
        fetcher
    );

    const handleDownload = async () => {
        try {
            const response = await fetch(`/api/admin/reports/${reportType}?period=${period}&format=csv`);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download report');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>{reportTitle}</span>
                        <Button onClick={handleDownload} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            📥 Download CSV
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                )}

                {error && (
                    <div className="text-center py-12 text-red-500">
                        Failed to load report data
                    </div>
                )}

                {data && (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <p className="text-sm text-slate-600">
                                Period: {new Date(data.period?.start).toLocaleDateString()} - {new Date(data.period?.end).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Render based on report type */}
                        {reportType === 'user_activity' && (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600">Total Activities</p>
                                        <p className="text-3xl font-bold text-blue-900">{data.totalActivities}</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Time</th>
                                                <th className="px-4 py-2 text-left">User</th>
                                                <th className="px-4 py-2 text-left">Action</th>
                                                <th className="px-4 py-2 text-left">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.activities?.slice(0, 50).map((activity: any, index: number) => (
                                                <tr key={index} className="border-b hover:bg-slate-50">
                                                    <td className="px-4 py-2">{new Date(activity.created_at).toLocaleString()}</td>
                                                    <td className="px-4 py-2">{activity.user_email || 'System'}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${activity.action_type === 'create' ? 'bg-green-100 text-green-800' :
                                                            activity.action_type === 'update' ? 'bg-blue-100 text-blue-800' :
                                                                activity.action_type === 'delete' ? 'bg-red-100 text-red-800' :
                                                                    activity.action_type === 'login' ? 'bg-purple-100 text-purple-800' :
                                                                        'bg-slate-100 text-slate-800'
                                                            }`}>
                                                            {activity.action_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">{activity.description}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {reportType === 'appointments' && (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600">Total</p>
                                        <p className="text-2xl font-bold text-blue-900">{data.stats?.total}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-green-600">Completed</p>
                                        <p className="text-2xl font-bold text-green-900">{data.stats?.completed}</p>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg">
                                        <p className="text-sm text-yellow-600">Pending</p>
                                        <p className="text-2xl font-bold text-yellow-900">{data.stats?.pending}</p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <p className="text-sm text-red-600">Cancelled</p>
                                        <p className="text-2xl font-bold text-red-900">{data.stats?.cancelled}</p>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Date</th>
                                                <th className="px-4 py-2 text-left">Time</th>
                                                <th className="px-4 py-2 text-left">Patient</th>
                                                <th className="px-4 py-2 text-left">Doctor</th>
                                                <th className="px-4 py-2 text-left">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.appointments?.slice(0, 50).map((apt: any, index: number) => (
                                                <tr key={index} className="border-b hover:bg-slate-50">
                                                    <td className="px-4 py-2">{apt.date}</td>
                                                    <td className="px-4 py-2">{apt.time}</td>
                                                    <td className="px-4 py-2">{apt.patient}</td>
                                                    <td className="px-4 py-2">{apt.doctor}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {apt.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {reportType === 'staff_performance' && (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Doctor</th>
                                                <th className="px-4 py-2 text-left">Specialty</th>
                                                <th className="px-4 py-2 text-left">Total Appointments</th>
                                                <th className="px-4 py-2 text-left">Completed</th>
                                                <th className="px-4 py-2 text-left">Completion Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.staffPerformance?.map((doc: any, index: number) => (
                                                <tr key={index} className="border-b hover:bg-slate-50">
                                                    <td className="px-4 py-2 font-medium">{doc.name}</td>
                                                    <td className="px-4 py-2">{doc.specialty}</td>
                                                    <td className="px-4 py-2">{doc.totalAppointments}</td>
                                                    <td className="px-4 py-2">{doc.completed}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-green-500 rounded-full"
                                                                    style={{ width: `${doc.completionRate}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm">{doc.completionRate}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {reportType === 'financial' && (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="bg-green-50 p-6 rounded-lg">
                                        <p className="text-sm text-green-600">Estimated Revenue</p>
                                        <p className="text-3xl font-bold text-green-900">
                                            KSh {data.summary?.estimatedRevenue?.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 p-6 rounded-lg">
                                        <p className="text-sm text-blue-600">Completed Appointments</p>
                                        <p className="text-3xl font-bold text-blue-900">
                                            {data.summary?.completedAppointments}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ {data.note}
                                    </p>
                                </div>
                            </div>
                        )}

                        {reportType === 'demographics' && (
                            <div className="space-y-4">
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <p className="text-sm text-purple-600">Total Patients</p>
                                    <p className="text-3xl font-bold text-purple-900">{data.totalPatients}</p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <h4 className="font-medium mb-2">By Age Group</h4>
                                        <div className="space-y-2">
                                            {data.byAgeGroup && Object.entries(data.byAgeGroup).map(([group, count]: [string, any]) => (
                                                <div key={group} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                                    <span>{group}</span>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">By Gender</h4>
                                        <div className="space-y-2">
                                            {data.byGender && Object.entries(data.byGender).map(([gender, count]: [string, any]) => (
                                                <div key={gender} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                                                    <span className="capitalize">{gender}</span>
                                                    <span className="font-medium">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {reportType === 'system_health' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                                    <span className="text-2xl">✅</span>
                                    <span className="text-lg font-medium text-green-800">System Status: Healthy</span>
                                </div>
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-blue-600">Total Users</p>
                                        <p className="text-2xl font-bold text-blue-900">{data.systemStats?.totalUsers}</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <p className="text-sm text-purple-600">Total Patients</p>
                                        <p className="text-2xl font-bold text-purple-900">{data.systemStats?.totalPatients}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <p className="text-sm text-green-600">Total Appointments</p>
                                        <p className="text-2xl font-bold text-green-900">{data.systemStats?.totalAppointments}</p>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-lg">
                                        <p className="text-sm text-orange-600">Recent Activities</p>
                                        <p className="text-2xl font-bold text-orange-900">{data.systemStats?.recentActivities}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

interface ActivityLog {
    id: string;
    user_email: string;
    user_role: string;
    action: string;
    action_type: string;
    resource_type: string;
    description: string;
    created_at: string;
}

function ActivityLogsSection() {
    const { data, error, isLoading, mutate } = useSWR(`/api/admin/activity-logs?limit=100`, fetcher, {
        refreshInterval: 30000, // Refresh every 30 seconds
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-slate-500">Loading system-wide activity logs...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-slate-400">
                <p>Unable to load activity logs</p>
                <Button variant="secondary" size="sm" onClick={() => mutate()} className="mt-2">
                    🔄 Retry
                </Button>
            </div>
        );
    }

    const getActionIcon = (actionType: string) => {
        switch (actionType) {
            case 'create': return '➕';
            case 'update': return '✏️';
            case 'delete': return '🗑️';
            case 'login': return '🔑';
            case 'logout': return '🚪';
            case 'view': return '👁️';
            case 'download': return '📥';
            default: return '📋';
        }
    };

    const getActionColor = (actionType: string) => {
        switch (actionType) {
            case 'create': return 'bg-green-100 text-green-800';
            case 'update': return 'bg-blue-100 text-blue-800';
            case 'delete': return 'bg-red-100 text-red-800';
            case 'login': return 'bg-purple-100 text-purple-800';
            case 'logout': return 'bg-orange-100 text-orange-800';
            case 'view': return 'bg-cyan-100 text-cyan-800';
            case 'download': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="space-y-3">
            {data?.logs?.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    No activity logs yet. Activities will appear here as they occur.
                </div>
            ) : (
                data?.logs?.map((log: ActivityLog) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="text-xl">{getActionIcon(log.action_type)}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action_type)}`}>
                                    {log.action_type}
                                </span>
                                <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                                    {log.resource_type}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 mt-1 truncate">{log.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <span>{log.user_email || 'System'}</span>
                                <span>•</span>
                                <span>{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

export default function ReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [viewingReport, setViewingReport] = useState<{ type: string; title: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'reports' | 'activity'>('reports');

    // Fetch all analytics data
    const { data: stats, error: statsError, isLoading: statsLoading } = useSWR('/api/admin/stats', fetcher);
    const { data: appointmentData, error: appointmentError } = useSWR('/api/admin/analytics/appointments', fetcher);
    const { data: revenueData, error: revenueError } = useSWR('/api/admin/analytics/revenue', fetcher);
    const { data: demographicsData, error: demographicsError } = useSWR('/api/admin/analytics/demographics', fetcher);
    const { data: generatedReports } = useSWR('/api/admin/reports?limit=10', fetcher);

    const reportTypes = [
        {
            title: 'User Activity Report',
            description: 'Overview of user registrations and activity',
            icon: '👥',
            color: 'from-blue-500 to-blue-600',
            type: 'user_activity',
        },
        {
            title: 'Appointment Analytics',
            description: 'Appointment statistics and trends',
            icon: '📅',
            color: 'from-green-500 to-green-600',
            type: 'appointments',
        },
        {
            title: 'Staff Performance',
            description: 'Doctor and staff productivity metrics',
            icon: '👨‍⚕️',
            color: 'from-purple-500 to-purple-600',
            type: 'staff_performance',
        },
        {
            title: 'Financial Summary',
            description: 'Revenue and billing overview',
            icon: '💰',
            color: 'from-yellow-500 to-yellow-600',
            type: 'financial',
        },
        {
            title: 'Patient Demographics',
            description: 'Age, gender, and location breakdown',
            icon: '📊',
            color: 'from-cyan-500 to-cyan-600',
            type: 'demographics',
        },
        {
            title: 'System Health',
            description: 'System usage and performance metrics',
            icon: '🖥️',
            color: 'from-orange-500 to-orange-600',
            type: 'system_health',
        },
    ];

    const handleViewReport = (type: string, title: string) => {
        setViewingReport({ type, title });
    };

    const handleDownloadReport = async (type: string) => {
        try {
            const response = await fetch(`/api/admin/reports/${type}?period=${selectedPeriod}&format=csv`);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to download report');
        }
    };

    const handleExportAll = async () => {
        for (const report of reportTypes) {
            await handleDownloadReport(report.type);
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    };

    if (statsError) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-medium">Error loading reports</p>
                    <p className="text-slate-500 mt-2">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    // Color palette for charts
    const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Reports & Analytics</h1>
                    <p className="mt-1 text-slate-600">View system reports and generate analytics</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                    <Button
                        onClick={handleExportAll}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    >
                        📥 Export All Reports
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'reports'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    📊 Reports & Analytics
                </button>
                <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'activity'
                        ? 'text-purple-600 border-b-2 border-purple-600'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    📋 Activity Logs
                </button>
            </div>

            {activeTab === 'reports' && (
                <>
                    {/* Quick Stats */}
                    <div className="grid gap-4 md:grid-cols-4">
                        {[
                            { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'from-blue-500 to-blue-600' },
                            { label: 'Total Appointments', value: stats?.totalAppointments || 0, icon: '📅', color: 'from-green-500 to-green-600' },
                            { label: 'Registered Children', value: stats?.totalChildren || 0, icon: '👶', color: 'from-purple-500 to-purple-600' },
                            { label: 'Active Doctors', value: stats?.totalDoctors || 0, icon: '👨‍⚕️', color: 'from-orange-500 to-orange-600' },
                        ].map((stat, index) => (
                            <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-slate-500">{stat.label}</p>
                                            <p className="text-3xl font-bold text-slate-800 mt-1">
                                                {statsLoading ? '...' : stat.value}
                                            </p>
                                        </div>
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl`}>
                                            {stat.icon}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Analytics Charts Section */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Appointments Overview Chart */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Weekly Appointments</span>
                                    <span className="text-sm font-normal text-slate-500">Last 7 days</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {appointmentError ? (
                                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                                        Unable to load chart data
                                    </div>
                                ) : !appointmentData ? (
                                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                                        Loading chart...
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={appointmentData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="day" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="total" name="Total" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                            <Bar dataKey="completed" name="Completed" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Revenue Trend Chart */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Revenue Trend</span>
                                    <span className="text-sm font-normal text-slate-500">Last 6 months</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {revenueError ? (
                                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                                        Unable to load chart data
                                    </div>
                                ) : !revenueData ? (
                                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                                        Loading chart...
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="month" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value: any) => `KSh ${value.toLocaleString()}`}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                dot={{ fill: '#10b981', r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Patient Demographics Chart */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle>Patient Demographics by Age</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {demographicsError ? (
                                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                                        Unable to load chart data
                                    </div>
                                ) : !demographicsData ? (
                                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                                        Loading chart...
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={demographicsData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} (${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%)`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {demographicsData.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Insights */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle>Quick Insights</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl">
                                                📈
                                            </div>
                                            <div>
                                                <p className="text-sm text-blue-600 font-medium">Appointment Rate</p>
                                                <p className="text-2xl font-bold text-blue-900">
                                                    {stats?.appointmentGrowth || '+0%'}
                                                </p>
                                                <p className="text-xs text-blue-600">vs last week</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">
                                                ⭐
                                            </div>
                                            <div>
                                                <p className="text-sm text-green-600 font-medium">Completion Rate</p>
                                                <p className="text-2xl font-bold text-green-900">
                                                    {stats?.completionRate || '0%'}
                                                </p>
                                                <p className="text-xs text-green-600">Successful appointments</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Report Types */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {reportTypes.map((report, index) => (
                            <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                                <CardContent className="p-6">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center text-2xl text-white mb-4`}>
                                        {report.icon}
                                    </div>
                                    <h3 className="font-semibold text-lg text-slate-800">{report.title}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{report.description}</p>
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleViewReport(report.type, report.title)}
                                        >
                                            👁️ View Report
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleDownloadReport(report.type)}
                                        >
                                            📥 Download
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Recent Generated Reports */}
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle>Recent Generated Reports</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {generatedReports?.reports?.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        No reports generated yet. Click &quot;View Report&quot; or &quot;Download&quot; to generate reports.
                                    </div>
                                ) : generatedReports?.reports ? (
                                    generatedReports.reports.map((report: any) => (
                                        <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">📄</span>
                                                <div>
                                                    <p className="font-medium text-slate-800">{report.report_name}</p>
                                                    <p className="text-sm text-slate-500">
                                                        Generated on {new Date(report.created_at).toLocaleDateString()} by {report.generated_by_email}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleDownloadReport(report.report_type)}
                                            >
                                                Download
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <span className="text-4xl mb-4 block">📊</span>
                                        <p className="text-slate-600 font-medium">No reports generated yet</p>
                                        <p className="text-sm text-slate-400 mt-1">Click "View Report" or "Download" on any report type above to generate your first report.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {activeTab === 'activity' && (
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle>System-Wide Activity Logs</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">Tracking all activities across the entire system (auto-refreshes every 30s)</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Live
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                            <strong>📌 Note:</strong> This log captures all system activities including logins, patient registrations, appointments, prescriptions, lab orders, and more from all user roles.
                        </div>
                        <ActivityLogsSection />
                    </CardContent>
                </Card>
            )}

            {/* Report View Modal */}
            {viewingReport && (
                <ReportViewModal
                    isOpen={true}
                    onClose={() => setViewingReport(null)}
                    reportType={viewingReport.type}
                    reportTitle={viewingReport.title}
                    period={selectedPeriod}
                />
            )}
        </div>
    );
}