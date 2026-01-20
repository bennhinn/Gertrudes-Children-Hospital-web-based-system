'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
});

export default function ReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    
    // Fetch all analytics data
    const { data: stats, error: statsError, isLoading: statsLoading } = useSWR('/api/admin/stats', fetcher);
    const { data: appointmentData, error: appointmentError } = useSWR('/api/admin/analytics/appointments', fetcher);
    const { data: revenueData, error: revenueError } = useSWR('/api/admin/analytics/revenue', fetcher);
    const { data: demographicsData, error: demographicsError } = useSWR('/api/admin/analytics/demographics', fetcher);

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

    if (statsError) {
        return (
            <div className="flex items-center justify-center min-h-100">
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
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        📥 Export All Reports
                    </Button>
                </div>
            </div>

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
                    <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center text-2xl text-white mb-4`}>
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