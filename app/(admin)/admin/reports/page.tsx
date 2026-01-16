'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function ReportsPage() {
    const { data: stats, error, isLoading } = useSWR('/api/admin/stats', fetcher);

    const reportTypes = [
        {
            title: 'User Activity Report',
            description: 'Overview of user registrations and activity',
            icon: '👥',
            color: 'from-blue-500 to-blue-600',
        },
        {
            title: 'Appointment Analytics',
            description: 'Appointment statistics and trends',
            icon: '📅',
            color: 'from-green-500 to-green-600',
        },
        {
            title: 'Staff Performance',
            description: 'Doctor and staff productivity metrics',
            icon: '👨‍⚕️',
            color: 'from-purple-500 to-purple-600',
        },
        {
            title: 'Financial Summary',
            description: 'Revenue and billing overview',
            icon: '💰',
            color: 'from-yellow-500 to-yellow-600',
        },
        {
            title: 'Patient Demographics',
            description: 'Age, gender, and location breakdown',
            icon: '📊',
            color: 'from-cyan-500 to-cyan-600',
        },
        {
            title: 'System Health',
            description: 'System usage and performance metrics',
            icon: '🖥️',
            color: 'from-orange-500 to-orange-600',
        },
    ];

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <div className="text-center">
                    <p className="text-red-500 text-lg font-medium">Error loading reports</p>
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
                    <h1 className="text-3xl font-bold text-slate-800">Reports & Analytics</h1>
                    <p className="mt-1 text-slate-600">View system reports and generate analytics</p>
                </div>
                <Button className="bg-linear-to-r from-blue-500 to-purple-600 text-white">
                    📥 Export All Reports
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-none shadow-md">
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-slate-800">{isLoading ? '...' : stats?.totalUsers || 0}</p>
                            <p className="text-sm text-slate-500 mt-1">Total Users</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-slate-800">{isLoading ? '...' : stats?.totalAppointments || 0}</p>
                            <p className="text-sm text-slate-500 mt-1">Total Appointments</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-slate-800">{isLoading ? '...' : stats?.totalChildren || 0}</p>
                            <p className="text-sm text-slate-500 mt-1">Registered Children</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md">
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-slate-800">{isLoading ? '...' : stats?.totalDoctors || 0}</p>
                            <p className="text-sm text-slate-500 mt-1">Active Doctors</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Types */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reportTypes.map((report, index) => (
                    <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                            <div className={`w-14 h-14 rounded-xl bg-linear-to-br ${report.color} flex items-center justify-center text-2xl text-white mb-4`}>
                                {report.icon}
                            </div>
                            <h3 className="font-semibold text-lg text-slate-800">{report.title}</h3>
                            <p className="text-sm text-slate-500 mt-1">{report.description}</p>
                            <div className="mt-4 flex gap-2">
                                <Button variant="secondary" size="sm">View Report</Button>
                                <Button variant="secondary" size="sm">Download</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Reports */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle>Recent Generated Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">📄</span>
                                <div>
                                    <p className="font-medium text-slate-800">Monthly User Activity Report</p>
                                    <p className="text-sm text-slate-500">Generated on Jan 10, 2026</p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm">Download</Button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">📄</span>
                                <div>
                                    <p className="font-medium text-slate-800">Q4 2025 Appointment Summary</p>
                                    <p className="text-sm text-slate-500">Generated on Jan 5, 2026</p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm">Download</Button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">📄</span>
                                <div>
                                    <p className="font-medium text-slate-800">Annual Financial Report 2025</p>
                                    <p className="text-sm text-slate-500">Generated on Jan 1, 2026</p>
                                </div>
                            </div>
                            <Button variant="secondary" size="sm">Download</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

