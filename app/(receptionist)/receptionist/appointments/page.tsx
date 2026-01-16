'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface Appointment {
    id: string
    scheduled_for: string
    status: string
    notes: string | null
    qr_code: string | null
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

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
type DateFilter = 'today' | 'tomorrow' | 'week' | 'all'

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [dateFilter, setDateFilter] = useState<DateFilter>('today')

    const loadAppointments = useCallback(async () => {
        setLoading(true)
        try {
            const supabase = createClient()

            // Calculate date range
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            let startDate = today
            let endDate: Date | null = null

            switch (dateFilter) {
                case 'today':
                    endDate = new Date(today)
                    endDate.setDate(endDate.getDate() + 1)
                    break
                case 'tomorrow':
                    startDate = new Date(today)
                    startDate.setDate(startDate.getDate() + 1)
                    endDate = new Date(startDate)
                    endDate.setDate(endDate.getDate() + 1)
                    break
                case 'week':
                    endDate = new Date(today)
                    endDate.setDate(endDate.getDate() + 7)
                    break
                case 'all':
                    // No date restriction
                    break
            }

            let query = supabase
                .from('appointments')
                .select(`
          *,
          child:children(id, full_name, dob, gender),
          caregiver:caregivers(id, profiles(full_name, phone)),
          doctor:doctors(id, profiles(full_name))
        `)
                .order('scheduled_for', { ascending: true })

            if (dateFilter !== 'all') {
                query = query.gte('scheduled_for', startDate.toISOString())
                if (endDate) {
                    query = query.lt('scheduled_for', endDate.toISOString())
                }
            }

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter)
            }

            const { data, error } = await query

            if (error) throw error
            setAppointments(data || [])
        } catch (error) {
            console.error('Error loading appointments:', error)
        } finally {
            setLoading(false)
        }
    }, [dateFilter, statusFilter])

    useEffect(() => {
        loadAppointments()
    }, [loadAppointments])

    // Filter by search query
    const filteredAppointments = appointments.filter(apt => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            apt.child?.full_name?.toLowerCase().includes(query) ||
            apt.caregiver?.profiles?.full_name?.toLowerCase().includes(query) ||
            apt.caregiver?.profiles?.phone?.includes(query)
        )
    })

    function formatDateTime(dateString: string) {
        const date = new Date(dateString)
        return {
            date: date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        }
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
            case 'pending':
                return <Badge variant="yellow">Pending</Badge>
            case 'confirmed':
                return <Badge variant="blue">Confirmed</Badge>
            case 'completed':
                return <Badge variant="green">Completed</Badge>
            case 'cancelled':
                return <Badge variant="gray">Cancelled</Badge>
            default:
                return <Badge variant="gray">{status}</Badge>
        }
    }

    async function handleCheckIn(appointment: Appointment) {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            const res = await fetch('/api/receptionist/queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: appointment.id,
                    child_id: appointment.child.id,
                    reason: 'Scheduled appointment',
                    checked_in_by: user?.id,
                }),
            })

            const data = await res.json()

            if (data.success) {
                alert(`Check-in successful! Queue number: ${data.queueNumber}`)
                loadAppointments()
            } else {
                alert('Check-in failed: ' + data.error)
            }
        } catch (error) {
            console.error('Error checking in:', error)
            alert('Check-in failed. Please try again.')
        }
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
                <p className="text-slate-500">View and manage all appointments</p>
            </div>

            {/* Filters */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-50">
                            <Input
                                placeholder="Search by patient or caregiver name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Date Filter */}
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="today">Today</option>
                            <option value="tomorrow">Tomorrow</option>
                            <option value="week">This Week</option>
                            <option value="all">All Time</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Appointments List */}
            <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">
                        {filteredAppointments.length} Appointment{filteredAppointments.length !== 1 ? 's' : ''}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={loadAppointments}>
                        ↻ Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100"></div>
                            ))}
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-4xl">📅</p>
                            <p className="mt-4 text-lg font-medium text-slate-600">No appointments found</p>
                            <p className="text-slate-400">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAppointments.map((apt) => {
                                const { date, time } = formatDateTime(apt.scheduled_for)
                                return (
                                    <div
                                        key={apt.id}
                                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md"
                                    >
                                        {/* Date/Time Column */}
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 text-center">
                                                <p className="text-xs font-medium text-slate-500">{date}</p>
                                                <p className="text-lg font-bold text-blue-600">{time}</p>
                                            </div>

                                            {/* Patient Info */}
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-100 to-purple-100 text-xl">
                                                    {apt.child?.gender === 'male' ? '👦' : '👧'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {apt.child?.full_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {apt.child?.dob ? getAge(apt.child.dob) : ''} •{' '}
                                                        {apt.caregiver?.profiles?.full_name || 'Unknown Caregiver'}
                                                    </p>
                                                    {apt.doctor && (
                                                        <p className="text-xs text-blue-600">
                                                            👨‍⚕️ Dr. {apt.doctor.profiles?.full_name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(apt.status)}

                                            {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleCheckIn(apt)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    Check In
                                                </Button>
                                            )}

                                            <Button size="sm" variant="secondary">
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
