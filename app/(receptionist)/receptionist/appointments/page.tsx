'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Appointment {
    id: string
    scheduled_for: string
    status: string
    visit_type: string
    child: {
        id: string
        full_name: string
        date_of_birth: string
    }
    caregiver: {
        id: string
        profiles: {
            full_name: string
            phone: string
        }
    }
}

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today')

    const loadAppointments = useCallback(async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    child:children(id, full_name, date_of_birth),
                    caregiver:caregivers(id, profiles(full_name, phone))
                `)
                .order('scheduled_for', { ascending: true })

            if (dateFilter === 'today') {
                const tomorrow = new Date(today)
                tomorrow.setDate(tomorrow.getDate() + 1)
                query = query
                    .gte('scheduled_for', today.toISOString())
                    .lt('scheduled_for', tomorrow.toISOString())
            } else if (dateFilter === 'week') {
                const nextWeek = new Date(today)
                nextWeek.setDate(nextWeek.getDate() + 7)
                query = query
                    .gte('scheduled_for', today.toISOString())
                    .lt('scheduled_for', nextWeek.toISOString())
            }

            const { data, error } = await query

            if (error) throw error
            setAppointments(data || [])
        } catch (error) {
            console.error('Error loading appointments:', error)
        } finally {
            setLoading(false)
        }
    }, [dateFilter])

    useEffect(() => {
        loadAppointments()
    }, [loadAppointments])

    function formatDateTime(dateString: string) {
        const date = new Date(dateString)
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'pending':
                return <Badge variant="yellow">Pending</Badge>
            case 'confirmed':
                return <Badge variant="blue">Confirmed</Badge>
            case 'checked_in':
                return <Badge variant="green">Checked In</Badge>
            case 'completed':
                return <Badge variant="gray">Completed</Badge>
            case 'cancelled':
                return <Badge variant="red">Cancelled</Badge>
            default:
                return <Badge variant="gray">{status}</Badge>
        }
    }

    const filteredAppointments = appointments.filter((apt) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            apt.child?.full_name?.toLowerCase().includes(query) ||
            apt.caregiver?.profiles?.full_name?.toLowerCase().includes(query) ||
            apt.caregiver?.profiles?.phone?.includes(query)
        )
    })

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
                    <p className="text-slate-500">{filteredAppointments.length} appointments found</p>
                </div>
                <Link href="/receptionist">
                    <Button variant="ghost">← Back</Button>
                </Link>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <Input
                    placeholder="Search by patient, caregiver, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 sm:flex-1"
                />
                <div className="flex gap-2">
                    <Button
                        variant={dateFilter === 'today' ? 'primary' : 'secondary'}
                        onClick={() => setDateFilter('today')}
                    >
                        Today
                    </Button>
                    <Button
                        variant={dateFilter === 'week' ? 'primary' : 'secondary'}
                        onClick={() => setDateFilter('week')}
                    >
                        This Week
                    </Button>
                    <Button
                        variant={dateFilter === 'all' ? 'primary' : 'secondary'}
                        onClick={() => setDateFilter('all')}
                    >
                        All
                    </Button>
                </div>
            </div>

            {/* Appointments List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200"></div>
                    ))}
                </div>
            ) : filteredAppointments.length === 0 ? (
                <Card className="border-none shadow-lg">
                    <CardContent className="py-12 text-center">
                        <p className="text-4xl">📅</p>
                        <p className="mt-4 text-lg font-medium text-slate-600">No appointments found</p>
                        <p className="text-slate-400">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredAppointments.map((apt) => {
                        const { date, time } = formatDateTime(apt.scheduled_for)
                        return (
                            <Card key={apt.id} className="border-none shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-blue-50 text-center">
                                                <span className="text-xs font-medium text-blue-600">{date.split(' ')[0]}</span>
                                                <span className="text-lg font-bold text-blue-700">{date.split(' ')[2]}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-slate-800">
                                                        {apt.child?.full_name || 'Unknown'}
                                                    </p>
                                                    {getStatusBadge(apt.status)}
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    🕐 {time} • {apt.visit_type || 'General'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    👤 {apt.caregiver?.profiles?.full_name || 'Unknown'} •
                                                    📞 {apt.caregiver?.profiles?.phone || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                                <Link href="/receptionist/check-in">
                                                    <Button size="sm">Check In</Button>
                                                </Link>
                                            )}
                                            <Button size="sm" variant="secondary">
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}