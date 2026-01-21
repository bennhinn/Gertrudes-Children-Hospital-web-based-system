'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, Phone, FileText, ChevronLeft, ChevronRight } from 'lucide-react'

interface Appointment {
    id: string
    scheduled_for: string
    status: string
    notes: string | null
    child_name: string
    child_dob: string | null
    caregiver_name: string | null
    caregiver_phone: string | null
}

export default function DoctorSchedulePage() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

    useEffect(() => {
        loadAppointments()
    }, [selectedDate, viewMode])

    async function loadAppointments() {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            // Calculate date range
            let startDate: Date
            let endDate: Date

            if (viewMode === 'day') {
                startDate = new Date(selectedDate)
                startDate.setHours(0, 0, 0, 0)
                endDate = new Date(selectedDate)
                endDate.setHours(23, 59, 59, 999)
            } else {
                startDate = getStartOfWeek(selectedDate)
                endDate = new Date(startDate)
                endDate.setDate(endDate.getDate() + 6)
                endDate.setHours(23, 59, 59, 999)
            }

            // Fetch appointments with joins
            const { data, error } = await supabase
                .from('appointments')
                .select(`
          id,
          scheduled_for,
          status,
          notes,
          child:children!inner(full_name, date_of_birth),
          caregiver:caregivers(profiles:profiles!inner(full_name, phone))
        `)
                .eq('doctor_id', user.id)
                .gte('scheduled_for', startDate.toISOString())
                .lte('scheduled_for', endDate.toISOString())
                .order('scheduled_for', { ascending: true })

            if (error) {
                console.error('Error loading appointments:', error)
                setLoading(false)
                return
            }

            // Transform data to flat structure
            const transformed: Appointment[] = (data || []).map((apt: any) => {
                const child = Array.isArray(apt.child) ? apt.child[0] : apt.child
                const caregiver = Array.isArray(apt.caregiver) ? apt.caregiver[0] : apt.caregiver
                const profiles = caregiver?.profiles
                const profile = Array.isArray(profiles) ? profiles[0] : profiles

                return {
                    id: apt.id,
                    scheduled_for: apt.scheduled_for,
                    status: apt.status || 'pending',
                    notes: apt.notes,
                    child_name: child?.full_name || 'Unknown',
                    child_dob: child?.date_of_birth || null,
                    caregiver_name: profile?.full_name || null,
                    caregiver_phone: profile?.phone || null,
                }
            })

            setAppointments(transformed)
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    function getStartOfWeek(date: Date): Date {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        d.setDate(diff)
        d.setHours(0, 0, 0, 0)
        return d
    }

    function getAge(dateOfBirth: string | null): string {
        if (!dateOfBirth) return 'N/A'

        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }

        if (age < 1) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 +
                (today.getMonth() - birthDate.getMonth())
            return `${months} mo`
        }

        return `${age} yrs`
    }

    function goToPrevious() {
        const newDate = new Date(selectedDate)
        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() - 1)
        } else {
            newDate.setDate(newDate.getDate() - 7)
        }
        setSelectedDate(newDate)
    }

    function goToNext() {
        const newDate = new Date(selectedDate)
        if (viewMode === 'day') {
            newDate.setDate(newDate.getDate() + 1)
        } else {
            newDate.setDate(newDate.getDate() + 7)
        }
        setSelectedDate(newDate)
    }

    function goToToday() {
        setSelectedDate(new Date())
    }

    async function updateStatus(appointmentId: string, newStatus: string) {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', appointmentId)

            if (error) throw error
            await loadAppointments()
        } catch (error) {
            console.error('Error updating appointment:', error)
            alert('Failed to update appointment')
        }
    }

    function getStatusColor(status: string): string {
        const colors: { [key: string]: string } = {
            confirmed: 'bg-green-100 text-green-800 border-green-200',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            completed: 'bg-blue-100 text-blue-800 border-blue-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200',
        }
        return colors[status] || 'bg-slate-100 text-slate-800 border-slate-200'
    }

    function groupByDate(apps: Appointment[]): { [key: string]: Appointment[] } {
        const grouped: { [key: string]: Appointment[] } = {}

        apps.forEach(apt => {
            const date = new Date(apt.scheduled_for).toDateString()
            if (!grouped[date]) grouped[date] = []
            grouped[date].push(apt)
        })

        return grouped
    }

    const groupedAppointments = groupByDate(appointments)

    const todayCount = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_for).toDateString()
        const today = new Date().toDateString()
        return aptDate === today
    }).length

    const upcomingCount = appointments.filter(apt =>
        apt.status !== 'cancelled' && apt.status !== 'completed'
    ).length

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 text-white shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">My Schedule</h1>
                        <p className="mt-1 text-blue-100">
                            {viewMode === 'day'
                                ? selectedDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })
                                : `Week of ${getStartOfWeek(selectedDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                })}`
                            }
                        </p>
                    </div>
                    <Button onClick={goToToday} className="bg-white text-blue-600 hover:bg-blue-50">
                        📅 Today
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 text-2xl">
                                📅
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Today's Appointments</p>
                                <p className="text-3xl font-bold text-blue-600">{todayCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-green-200 text-2xl">
                                ✓
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Upcoming</p>
                                <p className="text-3xl font-bold text-green-600">{upcomingCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 text-2xl">
                                📊
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total in Period</p>
                                <p className="text-3xl font-bold text-purple-600">{appointments.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* View Controls */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'day' ? 'primary' : 'secondary'}
                                onClick={() => setViewMode('day')}
                                className={viewMode === 'day' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                            >
                                Day
                            </Button>
                            <Button
                                variant={viewMode === 'week' ? 'primary' : 'secondary'}
                                onClick={() => setViewMode('week')}
                                className={viewMode === 'week' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                            >
                                Week
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={goToPrevious}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="secondary" onClick={goToNext}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Appointments */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Appointments
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse rounded-lg border p-4">
                                    <div className="h-4 w-1/4 rounded bg-slate-200"></div>
                                    <div className="mt-2 h-6 w-1/2 rounded bg-slate-200"></div>
                                </div>
                            ))}
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-4xl">📅</p>
                            <p className="mt-3 text-lg font-medium text-slate-600">No appointments</p>
                            <p className="mt-1 text-sm text-slate-500">
                                {viewMode === 'day' ? 'for this day' : 'for this week'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedAppointments).map(([date, dayAppts]) => (
                                <div key={date}>
                                    <h3 className="mb-3 text-sm font-semibold text-slate-600">
                                        {new Date(date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h3>
                                    <div className="space-y-3">
                                        {dayAppts.map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        {/* Time */}
                                                        <div className="flex flex-col items-center rounded-lg bg-blue-50 px-3 py-2">
                                                            <Clock className="h-4 w-4 text-blue-600" />
                                                            <span className="mt-1 text-sm font-bold text-blue-900">
                                                                {new Date(apt.scheduled_for).toLocaleTimeString('en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4 text-slate-400" />
                                                                <h4 className="font-semibold text-slate-900">{apt.child_name}</h4>
                                                                <span className="text-xs text-slate-500">
                                                                    ({getAge(apt.child_dob)})
                                                                </span>
                                                            </div>

                                                            {apt.caregiver_name && (
                                                                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                                                    <Phone className="h-3 w-3" />
                                                                    <span>{apt.caregiver_name}</span>
                                                                    {apt.caregiver_phone && (
                                                                        <>
                                                                            <span className="text-slate-400">•</span>
                                                                            <span>{apt.caregiver_phone}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {apt.notes && (
                                                                <div className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                                                                    <FileText className="mt-0.5 h-3 w-3 flex-shrink-0" />
                                                                    <span className="italic">{apt.notes}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge className={`${getStatusColor(apt.status)} border`}>
                                                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                                        </Badge>

                                                        {apt.status === 'pending' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => updateStatus(apt.id, 'confirmed')}
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                Confirm
                                                            </Button>
                                                        )}

                                                        {apt.status === 'confirmed' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => updateStatus(apt.id, 'completed')}
                                                                className="bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                Complete
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}