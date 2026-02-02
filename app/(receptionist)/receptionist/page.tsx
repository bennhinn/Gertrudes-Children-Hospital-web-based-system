'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
    UserCheck,
    Clock,
    Users,
    Timer,
    QrCode,
    ListOrdered,
    Search,
    UserPlus,
    ChevronRight,
    CheckCircle,
    Stethoscope,
    Calendar,
    Baby
} from 'lucide-react'

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
                return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">Waiting</Badge>
            case 'in_consultation':
                return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0">With Doctor</Badge>
            case 'completed':
                return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">Done</Badge>
            default:
                return <Badge className="bg-slate-50 text-slate-700 border-slate-200 text-[10px] px-1.5 py-0">{status}</Badge>
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
        <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-6">
            {/* Welcome Header - Compact on Mobile */}
            <div className="rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-4 text-white shadow-lg lg:rounded-2xl lg:p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold lg:text-2xl">Reception Dashboard</h1>
                        <p className="mt-0.5 text-sm text-blue-100 lg:mt-1">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <Link href="/receptionist/check-in">
                        <Button size="sm" className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm">
                            <QrCode className="mr-1.5 h-4 w-4" />
                            Check-In
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid - Compact on Mobile */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 lg:h-12 lg:w-12">
                                <UserCheck className="h-5 w-5 text-blue-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">Checked In</p>
                                <p className="text-2xl font-bold text-slate-800 lg:text-3xl">{stats.checkedInToday}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 lg:h-12 lg:w-12">
                                <Clock className="h-5 w-5 text-amber-600 lg:h-6 lg:w-6" />
                                {stats.currentlyWaiting > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">Waiting</p>
                                <p className="text-2xl font-bold text-amber-600 lg:text-3xl">{stats.currentlyWaiting}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 lg:h-12 lg:w-12">
                                <Stethoscope className="h-5 w-5 text-purple-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">With Doctor</p>
                                <p className="text-2xl font-bold text-purple-600 lg:text-3xl">{stats.withDoctor}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 lg:h-12 lg:w-12">
                                <Timer className="h-5 w-5 text-emerald-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">Avg Wait</p>
                                <p className="text-2xl font-bold text-emerald-600 lg:text-3xl">
                                    {stats.avgWaitTime > 0 ? `${stats.avgWaitTime}m` : '--'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions - Horizontal scroll on mobile */}
            <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
                <Link href="/receptionist/check-in" className="flex-shrink-0">
                    <Button variant="secondary" className="h-auto flex-col gap-1.5 px-5 py-3 lg:w-full lg:gap-2 lg:py-4">
                        <QrCode className="h-5 w-5 text-blue-600" />
                        <span className="text-xs font-medium lg:text-sm">Scan QR</span>
                    </Button>
                </Link>
                <Link href="/receptionist/queue" className="flex-shrink-0">
                    <Button variant="secondary" className="h-auto flex-col gap-1.5 px-5 py-3 lg:w-full lg:gap-2 lg:py-4">
                        <ListOrdered className="h-5 w-5 text-amber-600" />
                        <span className="text-xs font-medium lg:text-sm">Queue</span>
                    </Button>
                </Link>
                <Link href="/receptionist/appointments" className="flex-shrink-0">
                    <Button variant="secondary" className="h-auto flex-col gap-1.5 px-5 py-3 lg:w-full lg:gap-2 lg:py-4">
                        <Search className="h-5 w-5 text-purple-600" />
                        <span className="text-xs font-medium lg:text-sm">Search</span>
                    </Button>
                </Link>
                <Button variant="secondary" className="h-auto flex-shrink-0 flex-col gap-1.5 px-5 py-3 lg:gap-2 lg:py-4" disabled>
                    <UserPlus className="h-5 w-5 text-slate-400" />
                    <span className="text-xs font-medium lg:text-sm">Walk-In</span>
                </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                {/* Current Queue */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
                        <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                            <Users className="h-5 w-5 text-blue-600" />
                            Current Queue
                        </CardTitle>
                        <Link href="/receptionist/queue">
                            <Badge className="cursor-pointer bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                                All <ChevronRight className="ml-0.5 h-3 w-3" />
                            </Badge>
                        </Link>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 lg:px-6 lg:pb-6">
                        {recentCheckIns.length === 0 ? (
                            <div className="py-8 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <Users className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500">No patients checked in yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {recentCheckIns.map((checkIn) => (
                                    <div
                                        key={checkIn.id}
                                        className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 lg:p-4"
                                    >
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 lg:h-11 lg:w-11 lg:text-base">
                                            {checkIn.queue_number || '#'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {checkIn.appointment?.child?.full_name || 'Unknown'}
                                            </p>
                                            <p className="flex items-center gap-1 text-xs text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                {checkIn.reason || 'General'} • {getWaitTime(checkIn.checked_in_at)}
                                            </p>
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
                    <CardHeader className="flex flex-row items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
                        <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            Upcoming
                        </CardTitle>
                        <Link href="/receptionist/appointments">
                            <Badge className="cursor-pointer bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                                All <ChevronRight className="ml-0.5 h-3 w-3" />
                            </Badge>
                        </Link>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 lg:px-6 lg:pb-6">
                        {upcomingAppointments.length === 0 ? (
                            <div className="py-8 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <Calendar className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500">No upcoming appointments</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {upcomingAppointments.slice(0, 5).map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 lg:p-4"
                                    >
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 lg:h-11 lg:w-11">
                                            <Baby className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {apt.child?.full_name || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {formatTime(apt.scheduled_for)} • {apt.caregiver?.profiles?.full_name || 'Unknown'}
                                            </p>
                                        </div>
                                        <Button size="sm" variant="secondary" className="h-8 text-xs">
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
