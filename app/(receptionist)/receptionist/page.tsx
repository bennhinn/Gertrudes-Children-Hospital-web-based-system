'use client'

import { useEffect, useState, useCallback, memo } from 'react'
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
    Baby,
    X,
    Loader2,
    Ticket,
    RefreshCw,
    AlertCircle
} from 'lucide-react'

// ---------- Types (unchanged) ----------
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
    completed_at?: string
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

// ---------- Optimized Queue Ticket Modal (mobile-first) ----------
function QueueTicketModal({
    isOpen,
    onClose,
    queueNumber,
    patientName,
    time
}: {
    isOpen: boolean
    onClose: () => void
    queueNumber: number
    patientName: string
    time: string
}) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-sm animate-in zoom-in-95 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
                    {/* Header – reduced padding on mobile */}
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 py-6 text-center text-white sm:px-6 sm:py-8">
                        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm sm:h-16 sm:w-16">
                            <Ticket className="h-7 w-7 sm:h-8 sm:w-8" />
                        </div>
                        <h2 className="text-base font-semibold text-blue-100 sm:text-lg">Queue Ticket</h2>
                        <p className="mt-0.5 text-xs text-blue-200 sm:text-sm">Grand Children&apos;s Hospital</p>
                    </div>

                    {/* Dotted separator */}
                    <div className="relative">
                        <div className="absolute left-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-r-full bg-black/50"></div>
                        <div className="absolute right-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-l-full bg-black/50"></div>
                        <div className="border-t-2 border-dashed border-slate-200"></div>
                    </div>

                    {/* Content – compact spacing */}
                    <div className="px-5 py-5 text-center sm:px-6 sm:py-6">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                            Your Queue Number
                        </p>
                        <div className="my-3 flex items-center justify-center sm:my-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/30 sm:h-24 sm:w-24">
                                <span className="text-4xl font-bold text-white sm:text-5xl">{queueNumber}</span>
                            </div>
                        </div>
                        <p className="text-base font-semibold text-slate-800 sm:text-lg">{patientName}</p>
                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Checked in at {time}</p>

                        <div className="mt-5 rounded-xl bg-slate-50 p-3 sm:mt-6 sm:p-4">
                            <p className="text-xs text-slate-600 sm:text-sm">
                                Please wait in the waiting area. Your number will be called when it&apos;s your turn.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-5 py-3 sm:px-6 sm:py-4">
                        <Button
                            onClick={onClose}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg active:scale-[0.98]"
                        >
                            Done
                        </Button>
                    </div>
                </div>

                {/* Close button – larger hit area on mobile */}
                <button
                    onClick={onClose}
                    className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:-right-2 sm:-top-2 sm:h-8 sm:w-8"
                    aria-label="Close modal"
                >
                    <X className="h-5 w-5 text-slate-500 sm:h-4 sm:w-4" />
                </button>
            </div>
        </div>
    )
}

// ---------- Memoized Components for Performance ----------
const StatCard = memo(function StatCard({
    title,
    value,
    icon,
    color,
    badge
}: {
    title: string
    value: string | number
    icon: React.ReactNode
    color: 'blue' | 'amber' | 'purple' | 'emerald'
    badge?: { count?: number; animate?: boolean }
}) {
    const colorStyles = {
        blue: 'from-blue-100 to-blue-200 text-blue-600',
        amber: 'from-amber-100 to-orange-100 text-amber-600',
        purple: 'from-purple-100 to-purple-200 text-purple-600',
        emerald: 'from-emerald-100 to-green-100 text-emerald-600',
    }

    return (
        <Card className="border-none shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]">
            <CardContent className="p-3 sm:p-5">
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Smaller icon container on mobile */}
                    <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br sm:h-12 sm:w-12 ${colorStyles[color]}`}>
                        {icon}
                        {badge?.count !== undefined && badge.count > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                                {badge.animate && (
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                )}
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 sm:h-3 sm:w-3"></span>
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 sm:text-sm">{title}</p>
                        <p className={`text-xl font-bold sm:text-3xl text-${color}-600`}>{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
})

// Quick Action Button – full‑width on mobile, snap alignment
const QuickActionButton = memo(function QuickActionButton({
    href,
    onClick,
    icon,
    label,
    disabled
}: {
    href?: string
    onClick?: () => void
    icon: React.ReactNode
    label: string
    disabled?: boolean
}) {
    const baseClasses = `
        flex h-auto flex-shrink-0 flex-col items-center justify-center gap-1.5
        px-4 py-2.5 min-w-[80px] snap-start
        transition-all duration-200 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:pointer-events-none
        sm:px-5 sm:py-3 sm:min-w-0 sm:w-full
    `.trim()

    if (href) {
        return (
            <Link href={href} className={baseClasses}>
                <Button variant="secondary" className="h-auto flex-col gap-1.5 px-4 py-2.5 w-full sm:px-5 sm:py-3" disabled={disabled}>
                    {icon}
                    <span className="text-xs font-medium sm:text-sm">{label}</span>
                </Button>
            </Link>
        )
    }

    return (
        <Button
            variant="secondary"
            className={baseClasses}
            onClick={onClick}
            disabled={disabled}
        >
            {icon}
            <span className="text-xs font-medium sm:text-sm">{label}</span>
        </Button>
    )
})

// Queue Item – optimized touch target, reduced padding on mobile
const QueueItem = memo(function QueueItem({
    checkIn,
    isNext = false
}: {
    checkIn: CheckIn
    isNext?: boolean
}) {
    const getWaitTime = (checkedInAt: string) => {
        const now = new Date().getTime()
        const checkIn = new Date(checkedInAt).getTime()
        const diff = Math.round((now - checkIn) / 60000)
        if (diff < 1) return 'Just now'
        if (diff === 1) return '1 min'
        return `${diff} mins`
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'waiting':
                return {
                    bg: isNext ? 'bg-amber-50 border-amber-200' : 'bg-slate-50',
                    numberBg: isNext ? 'bg-amber-500' : 'bg-slate-200',
                    numberText: isNext ? 'text-white' : 'text-slate-600',
                    icon: <Clock className="h-3 w-3 text-amber-500" />,
                    label: `Waiting ${getWaitTime(checkIn.checked_in_at)}`
                }
            case 'in_consultation':
                return {
                    bg: 'bg-blue-50 border-blue-100',
                    numberBg: 'bg-blue-500',
                    numberText: 'text-white',
                    icon: <Stethoscope className="h-3 w-3 text-blue-500" />,
                    label: 'With Doctor'
                }
            case 'completed':
                return {
                    bg: 'bg-emerald-50 border-emerald-200',
                    numberBg: 'bg-green-500',
                    numberText: 'text-white',
                    icon: <CheckCircle className="h-3 w-3 text-green-500" />,
                    label: 'Completed'
                }
            default:
                return {
                    bg: 'bg-slate-50',
                    numberBg: 'bg-slate-200',
                    numberText: 'text-slate-600',
                    icon: null,
                    label: status
                }
        }
    }

    const config = getStatusConfig(checkIn.status)

    return (
        <Link
            href="/receptionist/queue"
            className={`flex items-center gap-2 rounded-xl p-2.5 transition-all duration-200 active:bg-slate-100 sm:gap-3 sm:p-3 lg:p-4 ${config.bg}`}
        >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold sm:h-11 sm:w-11 lg:h-12 lg:w-12 ${config.numberBg} ${config.numberText}`}>
                {checkIn.queue_number}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">
                        {checkIn.appointment?.child?.full_name || 'Unknown'}
                    </p>
                    {isNext && (
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 animate-pulse">
                            Next
                        </Badge>
                    )}
                </div>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                    {config.icon}
                    <span>{config.label}</span>
                </p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
        </Link>
    )
})

// Appointment Item – optimized for mobile touch
const AppointmentItem = memo(function AppointmentItem({
    appointment,
    onCheckIn,
    isCheckingIn
}: {
    appointment: Appointment
    onCheckIn: (apt: Appointment) => void
    isCheckingIn: boolean
}) {
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 transition-all duration-200 active:bg-slate-100 sm:gap-3 sm:p-3 lg:p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-200 sm:h-10 sm:w-10 lg:h-11 lg:w-11">
                <Baby className="h-4 w-4 text-purple-600 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">
                    {appointment.child?.full_name || 'Unknown'}
                </p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                        {formatTime(appointment.scheduled_for)} • {appointment.caregiver?.profiles?.full_name || 'Unknown'}
                    </span>
                </p>
            </div>
            <Button
                size="sm"
                className="h-8 min-w-[64px] text-xs shadow-sm transition-all active:scale-95 active:bg-blue-700 sm:h-8 sm:px-3"
                onClick={() => onCheckIn(appointment)}
                disabled={isCheckingIn}
            >
                {isCheckingIn ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    'Check In'
                )}
            </Button>
        </div>
    )
})

// Skeleton – mobile‑optimized shimmer
function DashboardSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="border-none shadow-md">
                        <CardContent className="p-3 sm:p-5">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl bg-slate-200"></div>
                                <div className="flex-1 space-y-1.5 sm:space-y-2">
                                    <div className="h-2 w-16 rounded bg-slate-200 sm:h-3"></div>
                                    <div className="h-5 w-12 rounded bg-slate-300 sm:h-6"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="border-none shadow-md">
                        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                            <div className="h-5 w-32 rounded bg-slate-200"></div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
                            <div className="space-y-2">
                                {[...Array(3)].map((_, j) => (
                                    <div key={j} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 sm:p-3 lg:p-4">
                                        <div className="h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 rounded-xl bg-slate-200"></div>
                                        <div className="flex-1 space-y-1.5 sm:space-y-2">
                                            <div className="h-4 w-32 rounded bg-slate-200"></div>
                                            <div className="h-3 w-24 rounded bg-slate-200"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

// ---------- Main Dashboard ----------
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
    const [checkingIn, setCheckingIn] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [ticketModal, setTicketModal] = useState<{
        isOpen: boolean
        queueNumber: number
        patientName: string
        time: string
    }>({ isOpen: false, queueNumber: 0, patientName: '', time: '' })

    // Quick check-in – unchanged logic
    async function handleQuickCheckIn(appointment: Appointment) {
        setCheckingIn(appointment.id)
        setError(null)
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data: existingCheckIns } = await supabase
                .from('check_ins')
                .select('queue_number')
                .gte('checked_in_at', today.toISOString())
                .order('queue_number', { ascending: false })
                .limit(1)

            const nextQueueNumber = (existingCheckIns?.[0]?.queue_number || 0) + 1

            const { error: checkInError } = await supabase
                .from('check_ins')
                .insert({
                    appointment_id: appointment.id,
                    queue_number: nextQueueNumber,
                    status: 'waiting',
                    reason: 'Scheduled appointment',
                    checked_in_at: new Date().toISOString(),
                })

            if (checkInError) throw checkInError

            await supabase
                .from('appointments')
                .update({ status: 'checked_in' })
                .eq('id', appointment.id)

            const checkInTime = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            })

            setTicketModal({
                isOpen: true,
                queueNumber: nextQueueNumber,
                patientName: appointment.child?.full_name || 'Patient',
                time: checkInTime,
            })

            loadDashboardData()
        } catch (error) {
            console.error('Error checking in:', error)
            setError('Failed to check in patient. Please try again.')
        } finally {
            setCheckingIn(null)
        }
    }

    const loadDashboardData = useCallback(async () => {
        try {
            setError(null)
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data: checkIns, error: checkInsError } = await supabase
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

            if (checkInsError) throw checkInsError

            const checkInsData = checkIns || []
            const waitingCount = checkInsData.filter(c => c.status === 'waiting').length
            const inConsultation = checkInsData.filter(c => c.status === 'in_consultation').length

            const completedCheckIns = checkInsData.filter(c => c.status === 'completed' && c.completed_at)
            let avgWait = 0
            if (completedCheckIns.length > 0) {
                const totalWait = completedCheckIns.reduce((acc, c) => {
                    const checkInTime = new Date(c.checked_in_at).getTime()
                    const completedTime = new Date(c.completed_at).getTime()
                    return acc + (completedTime - checkInTime)
                }, 0)
                avgWait = Math.round(totalWait / completedCheckIns.length / 60000)
            }

            setStats({
                checkedInToday: checkInsData.length,
                currentlyWaiting: waitingCount,
                withDoctor: inConsultation,
                avgWaitTime: avgWait,
            })

            setRecentCheckIns(checkInsData.slice(0, 5))

            const { data: appointments, error: appointmentsError } = await supabase
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

            if (appointmentsError) throw appointmentsError

            setUpcomingAppointments(appointments || [])
        } catch (error) {
            console.error('Error loading dashboard data:', error)
            setError('Unable to load dashboard data. Please refresh.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDashboardData()

        const supabase = createClient()
        const channel = supabase
            .channel('receptionist-dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'check_ins' },
                () => loadDashboardData()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments' },
                () => loadDashboardData()
            )
            .subscribe()

        const interval = setInterval(loadDashboardData, 30000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [loadDashboardData])

    const handleRetry = () => {
        setLoading(true)
        loadDashboardData()
    }

    const todayFormatted = new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    })

    if (loading) {
        return <DashboardSkeleton />
    }

    return (
        <div className="space-y-4 pb-20 sm:space-y-6 lg:pb-6 animate-in fade-in duration-500">
            {/* Error banner – mobile‑friendly */}
            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 animate-in slide-in-from-top duration-300 sm:p-4 sm:gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                        <p className="font-medium text-red-800">{error}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRetry}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 h-8 px-2"
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                    </Button>
                </div>
            )}

            {/* Header – streamlined for mobile */}
            <div className="rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-3 text-white shadow-lg sm:p-4 lg:rounded-2xl lg:p-6">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                            <h1 className="text-base font-bold sm:text-lg lg:text-2xl">Dashboard</h1>
                            <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5 font-medium sm:text-xs">
                                Live
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-blue-100 sm:text-sm flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {todayFormatted}
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Button
                            variant="ghost"
                            onClick={handleRetry}
                            className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm h-8 w-8 sm:h-9 sm:w-9"
                            aria-label="Refresh"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Link href="/receptionist/check-in">
                            <Button size="sm" className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm">
                                <QrCode className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" />
                                Check-In
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid – two columns, compact */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
                <StatCard
                    title="Checked In"
                    value={stats.checkedInToday}
                    icon={<UserCheck className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />}
                    color="blue"
                />
                <StatCard
                    title="Waiting"
                    value={stats.currentlyWaiting}
                    icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />}
                    color="amber"
                    badge={{ count: stats.currentlyWaiting, animate: true }}
                />
                <StatCard
                    title="With Doctor"
                    value={stats.withDoctor}
                    icon={<Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />}
                    color="purple"
                />
                <StatCard
                    title="Avg Wait"
                    value={stats.avgWaitTime > 0 ? `${stats.avgWaitTime}m` : '--'}
                    icon={<Timer className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />}
                    color="emerald"
                />
            </div>

            {/* Quick Actions – snap scroll on mobile, full grid on desktop */}
            <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide sm:gap-3 lg:grid lg:grid-cols-4 lg:overflow-visible">
                <QuickActionButton
                    href="/receptionist/check-in"
                    icon={<QrCode className="h-5 w-5 text-blue-600" />}
                    label="Scan QR"
                />
                <QuickActionButton
                    href="/receptionist/queue"
                    icon={<ListOrdered className="h-5 w-5 text-amber-600" />}
                    label="Queue"
                />
                <QuickActionButton
                    href="/receptionist/appointments"
                    icon={<Search className="h-5 w-5 text-purple-600" />}
                    label="Search"
                />
                <QuickActionButton
                    icon={<UserPlus className="h-5 w-5 text-slate-400" />}
                    label="Walk-In"
                    disabled
                />
            </div>

            {/* Two‑column layout on desktop */}
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                {/* Current Queue */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                        <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base lg:text-lg">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                            Current Queue
                            {stats.currentlyWaiting > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 sm:text-xs">
                                    {stats.currentlyWaiting}
                                </Badge>
                            )}
                        </CardTitle>
                        <Link href="/receptionist/queue">
                            <Badge className="cursor-pointer bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-[10px] px-2 py-0.5 sm:text-xs">
                                Manage <ChevronRight className="ml-0.5 h-3 w-3" />
                            </Badge>
                        </Link>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6">
                        {recentCheckIns.length === 0 ? (
                            <div className="py-6 text-center sm:py-8">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 sm:h-12 sm:w-12">
                                    <Users className="h-5 w-5 text-slate-400 sm:h-6 sm:w-6" />
                                </div>
                                <p className="text-xs text-slate-500 sm:text-sm">No patients checked in</p>
                                <p className="text-xs text-slate-400">Check in to see them here</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5 sm:space-y-2">
                                {recentCheckIns.slice(0, 5).map((checkIn, index) => (
                                    <QueueItem
                                        key={checkIn.id}
                                        checkIn={checkIn}
                                        isNext={checkIn.status === 'waiting' && index === 0}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Appointments */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                        <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base lg:text-lg">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                            Upcoming
                        </CardTitle>
                        <Link href="/receptionist/appointments">
                            <Badge className="cursor-pointer bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 text-[10px] px-2 py-0.5 sm:text-xs">
                                All <ChevronRight className="ml-0.5 h-3 w-3" />
                            </Badge>
                        </Link>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6">
                        {upcomingAppointments.length === 0 ? (
                            <div className="py-6 text-center sm:py-8">
                                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 sm:h-12 sm:w-12">
                                    <Calendar className="h-5 w-5 text-slate-400 sm:h-6 sm:w-6" />
                                </div>
                                <p className="text-xs text-slate-500 sm:text-sm">No upcoming appointments</p>
                                <p className="text-xs text-slate-400">All checked in</p>
                            </div>
                        ) : (
                            <div className="space-y-1.5 sm:space-y-2">
                                {upcomingAppointments.slice(0, 5).map((apt) => (
                                    <AppointmentItem
                                        key={apt.id}
                                        appointment={apt}
                                        onCheckIn={handleQuickCheckIn}
                                        isCheckingIn={checkingIn === apt.id}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <QueueTicketModal
                isOpen={ticketModal.isOpen}
                onClose={() => setTicketModal(prev => ({ ...prev, isOpen: false }))}
                queueNumber={ticketModal.queueNumber}
                patientName={ticketModal.patientName}
                time={ticketModal.time}
            />
        </div>
    )
}