'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { X, Ticket, Loader2, Search, RefreshCw, ArrowLeft } from 'lucide-react'

interface Appointment {
    id: string
    scheduled_for: string
    status: string
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

// Queue Ticket Modal Component
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="relative w-full max-w-sm animate-in zoom-in-95 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Ticket Design */}
                <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 px-6 py-8 text-center text-white">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                            <Ticket className="h-8 w-8" />
                        </div>
                        <h2 className="text-lg font-semibold text-green-100">Check-In Successful!</h2>
                        <p className="mt-1 text-sm text-green-200">Grand Children&apos;s Hospital</p>
                    </div>

                    {/* Dotted separator */}
                    <div className="relative">
                        <div className="absolute left-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-r-full bg-black/50"></div>
                        <div className="absolute right-0 top-1/2 h-8 w-4 -translate-y-1/2 rounded-l-full bg-black/50"></div>
                        <div className="border-t-2 border-dashed border-slate-200"></div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 text-center">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Queue Number</p>
                        <div className="my-4 flex items-center justify-center">
                            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
                                <span className="text-6xl font-bold text-white">{queueNumber}</span>
                            </div>
                        </div>
                        <p className="text-xl font-semibold text-slate-800">{patientName}</p>
                        <p className="mt-1 text-sm text-slate-500">Checked in at {time}</p>

                        <div className="mt-6 rounded-xl bg-green-50 border border-green-100 p-4">
                            <p className="text-sm text-green-700">✓ Patient is now in the queue</p>
                            <p className="mt-1 text-xs text-green-600">Please ask them to wait in the waiting area</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-6 py-4 flex gap-3">
                        <Button variant="secondary" onClick={onClose} className="flex-1">
                            Check Another
                        </Button>
                        <Link href="/receptionist/queue" className="flex-1">
                            <Button className="w-full">
                                View Queue
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg"
                >
                    <X className="h-4 w-4 text-slate-500" />
                </button>
            </div>
        </div>
    )
}

export default function CheckInPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [checkingIn, setCheckingIn] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [ticketModal, setTicketModal] = useState<{
        isOpen: boolean
        queueNumber: number
        patientName: string
        time: string
    }>({ isOpen: false, queueNumber: 0, patientName: '', time: '' })
    const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

    // Load all today's appointments on mount
    useEffect(() => {
        loadTodayAppointments()
    }, [])

    async function loadTodayAppointments() {
        setLoading(true)
        setError(null)
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data, error: fetchError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    child:children(id, full_name, date_of_birth),
                    caregiver:caregivers(id, profiles(full_name, phone))
                `)
                .gte('scheduled_for', today.toISOString())
                .in('status', ['pending', 'confirmed'])
                .order('scheduled_for', { ascending: true })
                .limit(50)

            if (fetchError) {
                console.error('Fetch error:', fetchError)
                throw fetchError
            }

            setAllAppointments(data || [])
            setAppointments(data || [])
        } catch (err) {
            console.error('Load error:', err)
            setError('Failed to load appointments. Please refresh the page.')
        } finally {
            setLoading(false)
        }
    }

    // Filter appointments when search query changes
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current)
        }

        if (searchQuery.length === 0) {
            setAppointments(allAppointments)
            return
        }

        if (searchQuery.length >= 2) {
            searchTimeout.current = setTimeout(() => {
                const lowerQuery = searchQuery.toLowerCase()
                const filtered = allAppointments.filter((apt) => {
                    const childName = apt.child?.full_name?.toLowerCase() || ''
                    const caregiverName = apt.caregiver?.profiles?.full_name?.toLowerCase() || ''
                    const phone = apt.caregiver?.profiles?.phone?.toLowerCase() || ''
                    return (
                        childName.includes(lowerQuery) ||
                        caregiverName.includes(lowerQuery) ||
                        phone.includes(lowerQuery)
                    )
                })
                setAppointments(filtered)
            }, 200)
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current)
            }
        }
    }, [searchQuery, allAppointments])

    async function handleCheckIn(appointment: Appointment) {
        setCheckingIn(appointment.id)
        setError(null)

        try {
            const supabase = createClient()

            // Get the next queue number for today
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data: existingCheckIns, error: queueError } = await supabase
                .from('check_ins')
                .select('queue_number')
                .gte('checked_in_at', today.toISOString())
                .order('queue_number', { ascending: false })
                .limit(1)

            if (queueError) {
                console.error('Queue number fetch error:', queueError)
            }

            const nextQueueNumber = (existingCheckIns?.[0]?.queue_number || 0) + 1

            // Create check-in record
            const { error: checkInError } = await supabase
                .from('check_ins')
                .insert({
                    appointment_id: appointment.id,
                    queue_number: nextQueueNumber,
                    status: 'waiting',
                    reason: 'Scheduled appointment',
                    checked_in_at: new Date().toISOString(),
                })

            if (checkInError) {
                console.error('Check-in insert error:', checkInError)
                throw new Error(checkInError.message || 'Failed to create check-in record')
            }

            // Update appointment status
            const { error: updateError } = await supabase
                .from('appointments')
                .update({ status: 'checked_in' })
                .eq('id', appointment.id)

            if (updateError) {
                console.error('Appointment update error:', updateError)
                // Don't throw here - check-in was successful
            }

            const childName = appointment.child?.full_name || 'Patient'
            const checkInTime = new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            })

            // Show queue ticket modal
            setTicketModal({
                isOpen: true,
                queueNumber: nextQueueNumber,
                patientName: childName,
                time: checkInTime,
            })

            // Remove from both lists
            setAppointments(prev => prev.filter(a => a.id !== appointment.id))
            setAllAppointments(prev => prev.filter(a => a.id !== appointment.id))
        } catch (err) {
            console.error('Check-in error:', err)
            setError(err instanceof Error ? err.message : 'Failed to check in patient. Please try again.')
        } finally {
            setCheckingIn(null)
        }
    }

    function formatTime(dateString: string) {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    function calculateAge(dateOfBirth: string) {
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        if (age < 1) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + monthDiff
            return `${months} months`
        }
        return `${age} years`
    }

    return (
        <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-6">
            {/* Header - Compact on Mobile */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Link href="/receptionist">
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 lg:h-10 lg:w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 lg:text-2xl">Patient Check-In</h1>
                        <p className="text-xs text-slate-500 lg:text-sm">
                            {allAppointments.length} appointments today
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => loadTodayAppointments()}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 lg:p-4 lg:text-base flex items-center gap-2">
                    <span>❌</span>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Search and Filter Section */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-4 lg:p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            placeholder="Search by patient name, caregiver, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 pl-10 pr-10 text-base"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="mt-2 text-sm text-slate-500">
                            Showing {appointments.length} of {allAppointments.length} appointments
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Appointments List */}
            {loading ? (
                <Card className="border-none shadow-lg">
                    <CardContent className="py-10 lg:py-12">
                        <div className="flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="mt-3 text-sm text-slate-500">Loading appointments...</p>
                        </div>
                    </CardContent>
                </Card>
            ) : appointments.length === 0 ? (
                <Card className="border-none shadow-lg">
                    <CardContent className="py-10 lg:py-12">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="text-4xl">{searchQuery ? '🔍' : '📅'}</div>
                            <p className="mt-3 text-base font-medium text-slate-600">
                                {searchQuery
                                    ? 'No matching patients found'
                                    : 'No pending appointments today'}
                            </p>
                            <p className="text-sm text-slate-400">
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'All patients have been checked in'}
                            </p>
                            {searchQuery && (
                                <Button
                                    variant="secondary"
                                    className="mt-4"
                                    onClick={() => setSearchQuery('')}
                                >
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {appointments.map((apt) => (
                        <Card key={apt.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-4 lg:p-5">
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-xl lg:h-14 lg:w-14 lg:text-2xl">
                                        👶
                                    </div>

                                    {/* Patient Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-slate-800 truncate text-base lg:text-lg">
                                                {apt.child?.full_name || 'Unknown'}
                                            </p>
                                            <Badge variant="blue" className="text-[10px] lg:text-xs">
                                                {formatTime(apt.scheduled_for)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {apt.child?.date_of_birth ? calculateAge(apt.child.date_of_birth) : ''} •
                                            Guardian: {apt.caregiver?.profiles?.full_name || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            📞 {apt.caregiver?.profiles?.phone || 'No phone'}
                                        </p>

                                        {/* Mobile Check-In Button */}
                                        <div className="mt-3 lg:hidden">
                                            <Button
                                                className="w-full h-11 text-sm font-medium"
                                                onClick={() => handleCheckIn(apt)}
                                                disabled={checkingIn === apt.id}
                                            >
                                                {checkingIn === apt.id ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Checking in...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Ticket className="mr-2 h-4 w-4" />
                                                        Check In Patient
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Desktop Check-In Button */}
                                    <div className="hidden lg:block shrink-0">
                                        <Button
                                            className="h-11"
                                            onClick={() => handleCheckIn(apt)}
                                            disabled={checkingIn === apt.id}
                                        >
                                            {checkingIn === apt.id ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Checking in...
                                                </>
                                            ) : (
                                                <>
                                                    <Ticket className="mr-2 h-4 w-4" />
                                                    Check In
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Queue Ticket Modal */}
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