'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface CheckIn {
    id: string
    checked_in_at: string
    status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled'
    queue_number: number
    reason: string
    vitals: {
        temperature?: string
        weight?: string
        height?: string
        blood_pressure?: string
    } | null
    notes: string | null
    appointment: {
        id: string
        scheduled_for: string
        child: {
            id: string
            full_name: string
            dob: string
            gender: string
        }
        caregiver: {
            id: string
            profiles: {
                full_name: string
                phone: string
            }
        }
        doctor?: {
            id: string
            profiles: {
                full_name: string
            }
        }
    }
}

interface QueueStats {
    total: number
    waiting: number
    inConsultation: number
    completed: number
}

type FilterStatus = 'all' | 'waiting' | 'in_consultation' | 'completed'

export default function QueueManagementPage() {
    const [checkIns, setCheckIns] = useState<CheckIn[]>([])
    const [stats, setStats] = useState<QueueStats>({
        total: 0,
        waiting: 0,
        inConsultation: 0,
        completed: 0,
    })
    const [filter, setFilter] = useState<FilterStatus>('all')
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    const loadQueue = useCallback(async () => {
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data, error } = await supabase
                .from('check_ins')
                .select(`
          *,
          appointment:appointments(
            id,
            scheduled_for,
            child:children(id, full_name, dob, gender),
            caregiver:caregivers(id, profiles(full_name, phone)),
            doctor:doctors(id, profiles(full_name))
          )
        `)
                .gte('checked_in_at', today.toISOString())
                .order('queue_number', { ascending: true })

            if (error) throw error

            const checkInsData = data || []
            setCheckIns(checkInsData)
            setStats({
                total: checkInsData.length,
                waiting: checkInsData.filter(c => c.status === 'waiting').length,
                inConsultation: checkInsData.filter(c => c.status === 'in_consultation').length,
                completed: checkInsData.filter(c => c.status === 'completed').length,
            })
        } catch (error) {
            console.error('Error loading queue:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadQueue()

        // Real-time subscription
        const supabase = createClient()
        const channel = supabase
            .channel('queue-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'check_ins' },
                () => loadQueue()
            )
            .subscribe()

        // Refresh every 30 seconds
        const interval = setInterval(loadQueue, 30000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [loadQueue])

    async function updateStatus(checkInId: string, newStatus: 'waiting' | 'in_consultation' | 'completed') {
        setUpdating(checkInId)
        try {
            const supabase = createClient()
            const updateData: Record<string, unknown> = { status: newStatus }

            if (newStatus === 'completed') {
                updateData.completed_at = new Date().toISOString()
            }

            const { error } = await supabase
                .from('check_ins')
                .update(updateData)
                .eq('id', checkInId)

            if (error) throw error

            // Update local state optimistically
            setCheckIns(prev =>
                prev.map(c =>
                    c.id === checkInId ? { ...c, status: newStatus } : c
                )
            )

            // Recalculate stats
            loadQueue()
        } catch (error) {
            console.error('Error updating status:', error)
        } finally {
            setUpdating(null)
        }
    }

    function getWaitTime(checkedInAt: string) {
        const now = new Date().getTime()
        const checkIn = new Date(checkedInAt).getTime()
        const diff = Math.round((now - checkIn) / 60000)
        if (diff < 1) return 'Just now'
        if (diff === 1) return '1 min'
        if (diff < 60) return `${diff} mins`
        const hours = Math.floor(diff / 60)
        const mins = diff % 60
        return `${hours}h ${mins}m`
    }

    function getAge(dob: string) {
        const today = new Date()
        const birthDate = new Date(dob)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        if (age < 1) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
            return `${months} mo`
        }
        return `${age} yrs`
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'waiting':
                return <Badge variant="yellow" className="animate-pulse">Waiting</Badge>
            case 'in_consultation':
                return <Badge variant="blue">With Doctor</Badge>
            case 'completed':
                return <Badge variant="green">Completed</Badge>
            case 'cancelled':
                return <Badge variant="gray">Cancelled</Badge>
            default:
                return <Badge variant="gray">{status}</Badge>
        }
    }

    const filteredCheckIns = filter === 'all'
        ? checkIns
        : checkIns.filter(c => c.status === filter)

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 animate-pulse rounded-2xl bg-slate-200"></div>
                <div className="grid gap-4 sm:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Queue Management</h1>
                    <p className="text-slate-500">Manage patient check-ins and waiting queue</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                    </span>
                    <span className="text-sm text-slate-500">Live updates</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`rounded-xl p-4 text-left transition-all ${filter === 'all' ? 'ring-2 ring-blue-500' : ''
                        } bg-white shadow-md hover:shadow-lg`}
                >
                    <p className="text-sm text-slate-500">Total Today</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                </button>
                <button
                    onClick={() => setFilter('waiting')}
                    className={`rounded-xl p-4 text-left transition-all ${filter === 'waiting' ? 'ring-2 ring-yellow-500' : ''
                        } bg-linear-to-br from-yellow-50 to-orange-50 shadow-md hover:shadow-lg`}
                >
                    <p className="text-sm text-yellow-700">Waiting</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
                </button>
                <button
                    onClick={() => setFilter('in_consultation')}
                    className={`rounded-xl p-4 text-left transition-all ${filter === 'in_consultation' ? 'ring-2 ring-blue-500' : ''
                        } bg-linear-to-br from-blue-50 to-indigo-50 shadow-md hover:shadow-lg`}
                >
                    <p className="text-sm text-blue-700">With Doctor</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inConsultation}</p>
                </button>
                <button
                    onClick={() => setFilter('completed')}
                    className={`rounded-xl p-4 text-left transition-all ${filter === 'completed' ? 'ring-2 ring-green-500' : ''
                        } bg-linear-to-br from-green-50 to-emerald-50 shadow-md hover:shadow-lg`}
                >
                    <p className="text-sm text-green-700">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </button>
            </div>

            {/* Queue List */}
            <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">
                        {filter === 'all' ? 'All Patients' : `${filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${filteredCheckIns.length})`}
                    </CardTitle>
                    {filter !== 'all' && (
                        <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
                            Show All
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {filteredCheckIns.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-4xl">📋</p>
                            <p className="mt-4 text-lg font-medium text-slate-600">No patients in queue</p>
                            <p className="text-slate-400">Patients will appear here after check-in</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredCheckIns.map((checkIn) => (
                                <div
                                    key={checkIn.id}
                                    className={`rounded-xl border p-4 transition-all ${checkIn.status === 'waiting'
                                            ? 'border-yellow-200 bg-yellow-50/50'
                                            : checkIn.status === 'in_consultation'
                                                ? 'border-blue-200 bg-blue-50/50'
                                                : 'border-slate-200 bg-slate-50/50'
                                        }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        {/* Patient Info */}
                                        <div className="flex items-start gap-4">
                                            <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white ${checkIn.status === 'waiting'
                                                    ? 'bg-linear-to-br from-yellow-400 to-orange-500'
                                                    : checkIn.status === 'in_consultation'
                                                        ? 'bg-linear-to-br from-blue-400 to-blue-600'
                                                        : 'bg-linear-to-br from-green-400 to-green-600'
                                                }`}>
                                                #{checkIn.queue_number}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-800">
                                                        {checkIn.appointment?.child?.full_name || 'Unknown Patient'}
                                                    </h3>
                                                    {getStatusBadge(checkIn.status)}
                                                </div>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {checkIn.appointment?.child?.gender === 'male' ? '👦' : '👧'}{' '}
                                                    {checkIn.appointment?.child?.dob ? getAge(checkIn.appointment.child.dob) : 'Age unknown'} •{' '}
                                                    {checkIn.reason || 'General checkup'}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    👤 Caregiver: {checkIn.appointment?.caregiver?.profiles?.full_name || 'Unknown'} •{' '}
                                                    📞 {checkIn.appointment?.caregiver?.profiles?.phone || 'No phone'}
                                                </p>
                                                {checkIn.appointment?.doctor && (
                                                    <p className="mt-1 text-xs text-blue-600">
                                                        👨‍⚕️ Dr. {checkIn.appointment.doctor.profiles?.full_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Wait Time & Actions */}
                                        <div className="flex flex-col items-end gap-3">
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500">Wait time</p>
                                                <p className={`text-lg font-semibold ${checkIn.status === 'waiting' ? 'text-yellow-600' : 'text-slate-600'
                                                    }`}>
                                                    {getWaitTime(checkIn.checked_in_at)}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                {checkIn.status === 'waiting' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateStatus(checkIn.id, 'in_consultation')}
                                                        disabled={updating === checkIn.id}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        {updating === checkIn.id ? '...' : '→ Send to Doctor'}
                                                    </Button>
                                                )}
                                                {checkIn.status === 'in_consultation' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateStatus(checkIn.id, 'completed')}
                                                        disabled={updating === checkIn.id}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {updating === checkIn.id ? '...' : '✓ Mark Complete'}
                                                    </Button>
                                                )}
                                                {checkIn.status !== 'completed' && (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => updateStatus(checkIn.id, 'waiting')}
                                                        disabled={updating === checkIn.id || checkIn.status === 'waiting'}
                                                    >
                                                        ← Back to Waiting
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vitals if available */}
                                    {checkIn.vitals && Object.keys(checkIn.vitals).length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-200 pt-4">
                                            {checkIn.vitals.temperature && (
                                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                                                    🌡️ {checkIn.vitals.temperature}°C
                                                </span>
                                            )}
                                            {checkIn.vitals.weight && (
                                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700">
                                                    ⚖️ {checkIn.vitals.weight} kg
                                                </span>
                                            )}
                                            {checkIn.vitals.height && (
                                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                                                    📏 {checkIn.vitals.height} cm
                                                </span>
                                            )}
                                            {checkIn.vitals.blood_pressure && (
                                                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">
                                                    💓 {checkIn.vitals.blood_pressure}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
