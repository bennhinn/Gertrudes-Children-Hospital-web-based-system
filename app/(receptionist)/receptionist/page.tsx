'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface QueueStats {
    checkedInToday: number
    currentlyWaiting: number
    withDoctor: number
    avgWaitTime: number
}

interface Appointment {
    id: string
    scheduled_for: string
    status: string
    child: {
        id: string
        full_name: string
    }
    caregiver: {
        profiles: {
            full_name: string
            phone: string
        }
    }
}

interface CheckIn {
    id: string
    checked_in_at: string
    status: string
    queue_number: number
    reason: string
    appointment: {
        id: string
        child: {
            full_name: string
        }
        caregiver: {
            profiles: {
                full_name: string
            }
        }
    }
}

export default function ReceptionistDashboard() {
    const [stats, setStats] = useState<QueueStats>({
        checkedInToday: 0,
        currentlyWaiting: 0,
        withDoctor: 0,
        avgWaitTime: 0,
    })
    const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
    const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([])
    const [loading, setLoading] = useState(true)

    const loadDashboardData = useCallback(async () => {
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Load check-ins for today
            const { data: checkIns } = await supabase
                .from('check_ins')
                .select(`
          *,
          appointment:appointments(
            id,
            child:children(full_name),
            caregiver:caregivers(profiles(full_name))
          )
        `)
                .gte('checked_in_at', today.toISOString())
                .order('checked_in_at', { ascending: false })

            const checkInsData = checkIns || []

            // Calculate stats
            const waitingCount = checkInsData.filter(c => c.status === 'waiting').length
            const inConsultation = checkInsData.filter(c => c.status === 'in_consultation').length

            // Calculate average wait time for completed check-ins
            const completedCheckIns = checkInsData.filter(c => c.status === 'completed' && c.completed_at)
            let avgWait = 0
            if (completedCheckIns.length > 0) {
                const totalWait = completedCheckIns.reduce((acc, c) => {
                    const checkInTime = new Date(c.checked_in_at).getTime()
                    const completedTime = new Date(c.completed_at).getTime()
                    return acc + (completedTime - checkInTime)
                }, 0)
                avgWait = Math.round(totalWait / completedCheckIns.length / 60000) // in minutes
            }

            setStats({
                checkedInToday: checkInsData.length,
                currentlyWaiting: waitingCount,
                withDoctor: inConsultation,
                avgWaitTime: avgWait,
            })

            setRecentCheckIns(checkInsData.slice(0, 5))

            // Load upcoming appointments (not yet checked in)
            const { data: appointments } = await supabase
                .from('appointments')
                .select(`
          *,
          child:children(id, full_name),
          caregiver:caregivers(profiles(full_name, phone))
        `)
                .gte('scheduled_for', today.toISOString())
                .in('status', ['pending', 'confirmed'])
                .order('scheduled_for', { ascending: true })
                .limit(10)

            setUpcomingAppointments(appointments || [])
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDashboardData()

        // Set up real-time subscription
        const supabase = createClient()
        const channel = supabase
            .channel('receptionist-dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'check_ins' },
                () => {
                    loadDashboardData()
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments' },
                () => {
                    loadDashboardData()
                }
            )
            .subscribe()

        // Refresh every 30 seconds
        const interval = setInterval(loadDashboardData, 30000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [loadDashboardData])

    function formatTime(dateString: string) {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    function getWaitTime(checkedInAt: string) {
        const now = new Date().getTime()
        const checkIn = new Date(checkedInAt).getTime()
        const diff = Math.round((now - checkIn) / 60000)
        if (diff < 1) return 'Just now'
        if (diff === 1) return '1 min'
        return `${diff} mins`
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'waiting':
                return <Badge variant="yellow">Waiting</Badge>
            case 'in_consultation':
                return <Badge variant="blue">With Doctor</Badge>
            case 'completed':
                return <Badge variant="green">Completed</Badge>
            default:
                return <Badge variant="gray">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 w-24 rounded bg-slate-200"></div>
                                <div className="mt-2 h-8 w-16 rounded bg-slate-200"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Welcome Header */}
            <div className="rounded-2xl bg-linear-to-br from-blue-500 via-blue-600 to-cyan-500 p-6 text-white shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Reception Dashboard</h1>
                        <p className="mt-1 text-blue-100">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/receptionist/check-in">
                            <Button className="bg-white text-blue-600 hover:bg-blue-50">
                                📱 Quick Check-In
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-100 to-blue-200 text-2xl">
                                ✅
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Checked In Today</p>
                                <p className="text-3xl font-bold text-slate-800">{stats.checkedInToday}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-yellow-100 to-orange-200 text-2xl">
                                <span className="relative">
                                    ⏳
                                    {stats.currentlyWaiting > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-500"></span>
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Currently Waiting</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.currentlyWaiting}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-purple-100 to-purple-200 text-2xl">
                                👨‍⚕️
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">With Doctor</p>
                                <p className="text-3xl font-bold text-purple-600">{stats.withDoctor}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-green-100 to-emerald-200 text-2xl">
                                ⏱️
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Avg Wait Time</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {stats.avgWaitTime > 0 ? `${stats.avgWaitTime}m` : '--'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Link href="/receptionist/check-in">
                            <Button variant="secondary" className="h-auto w-full flex-col gap-2 py-4">
                                <span className="text-2xl">📱</span>
                                <span>Scan QR Code</span>
                            </Button>
                        </Link>
                        <Link href="/receptionist/queue">
                            <Button variant="secondary" className="h-auto w-full flex-col gap-2 py-4">
                                <span className="text-2xl">📋</span>
                                <span>View Queue</span>
                            </Button>
                        </Link>
                        <Link href="/receptionist/appointments">
                            <Button variant="secondary" className="h-auto w-full flex-col gap-2 py-4">
                                <span className="text-2xl">🔍</span>
                                <span>Search Patient</span>
                            </Button>
                        </Link>
                        <Button variant="secondary" className="h-auto flex-col gap-2 py-4" disabled>
                            <span className="text-2xl">➕</span>
                            <span>Add Walk-In</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Current Queue */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Current Queue</CardTitle>
                        <Link href="/receptionist/queue">
                            <Button variant="ghost" size="sm">
                                View All →
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentCheckIns.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-3xl">📋</p>
                                <p className="mt-2 text-slate-500">No patients checked in yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentCheckIns.map((checkIn) => (
                                    <div
                                        key={checkIn.id}
                                        className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                                {checkIn.queue_number || '#'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    {checkIn.appointment?.child?.full_name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {checkIn.reason || 'General checkup'} • {getWaitTime(checkIn.checked_in_at)}
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(checkIn.status)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Appointments */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                        <Link href="/receptionist/appointments">
                            <Button variant="ghost" size="sm">
                                View All →
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {upcomingAppointments.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-3xl">📅</p>
                                <p className="mt-2 text-slate-500">No upcoming appointments</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingAppointments.slice(0, 5).map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-lg">
                                                👶
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    {apt.child?.full_name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {formatTime(apt.scheduled_for)} • {apt.caregiver?.profiles?.full_name || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="secondary">
                                            Check In
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
