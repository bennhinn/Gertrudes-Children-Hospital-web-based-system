'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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

export default function CheckInPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(false)
    const [checkingIn, setCheckingIn] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined)

    useEffect(() => {
        if (searchQuery.length >= 2) {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current)
            }
            searchTimeout.current = setTimeout(() => {
                searchAppointments(searchQuery)
            }, 300)
        } else {
            setAppointments([])
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current)
            }
        }
    }, [searchQuery])

    async function searchAppointments(query: string) {
        setLoading(true)
        setError(null)
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data, error: searchError } = await supabase
                .from('appointments')
                .select(`
                    *,
                    child:children(id, full_name, date_of_birth),
                    caregiver:caregivers(id, profiles(full_name, phone))
                `)
                .gte('scheduled_for', today.toISOString())
                .in('status', ['pending', 'confirmed'])
                .or(`child.full_name.ilike.%${query}%,caregiver.profiles.full_name.ilike.%${query}%,caregiver.profiles.phone.ilike.%${query}%`)
                .order('scheduled_for', { ascending: true })
                .limit(10)

            if (searchError) throw searchError
            setAppointments(data || [])
        } catch (err) {
            console.error('Search error:', err)
            setError('Failed to search appointments')
        } finally {
            setLoading(false)
        }
    }

    async function handleCheckIn(appointment: Appointment) {
        setCheckingIn(appointment.id)
        setError(null)
        setSuccess(null)

        try {
            const supabase = createClient()

            // Get the next queue number for today
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data: existingCheckIns } = await supabase
                .from('check_ins')
                .select('queue_number')
                .gte('checked_in_at', today.toISOString())
                .order('queue_number', { ascending: false })
                .limit(1)

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

            if (checkInError) throw checkInError

            // Update appointment status
            await supabase
                .from('appointments')
                .update({ status: 'checked_in' })
                .eq('id', appointment.id)

            setSuccess(`${appointment.child.full_name} checked in successfully! Queue #${nextQueueNumber}`)
            setAppointments(prev => prev.filter(a => a.id !== appointment.id))
        } catch (err) {
            console.error('Check-in error:', err)
            setError('Failed to check in patient')
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
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Patient Check-In</h1>
                    <p className="text-slate-500">Search for a patient or scan their QR code</p>
                </div>
                <Link href="/receptionist">
                    <Button variant="ghost">← Back</Button>
                </Link>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="rounded-lg bg-green-50 p-4 text-green-700">
                    ✅ {success}
                </div>
            )}
            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-red-700">
                    ❌ {error}
                </div>
            )}

            {/* QR Scanner Placeholder */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">📱 Scan QR Code</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12">
                        <span className="text-5xl">📷</span>
                        <p className="mt-4 text-slate-500">QR Scanner Coming Soon</p>
                        <p className="text-sm text-slate-400">Use manual search below for now</p>
                    </div>
                </CardContent>
            </Card>

            {/* Manual Search */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">🔍 Search Patient</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        placeholder="Search by patient name, caregiver name, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12"
                    />

                    {loading && (
                        <div className="py-8 text-center text-slate-500">
                            Searching...
                        </div>
                    )}

                    {!loading && appointments.length === 0 && searchQuery.length >= 2 && (
                        <div className="py-8 text-center">
                            <p className="text-3xl">🔍</p>
                            <p className="mt-2 text-slate-500">No appointments found</p>
                        </div>
                    )}

                    {appointments.length > 0 && (
                        <div className="space-y-3">
                            {appointments.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl">
                                            👶
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">
                                                {apt.child?.full_name || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {apt.child?.date_of_birth ? calculateAge(apt.child.date_of_birth) : ''} •
                                                {apt.caregiver?.profiles?.full_name || 'Unknown caregiver'}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                📞 {apt.caregiver?.profiles?.phone || 'No phone'} •
                                                🕐 {formatTime(apt.scheduled_for)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleCheckIn(apt)}
                                        disabled={checkingIn === apt.id}
                                    >
                                        {checkingIn === apt.id ? 'Checking in...' : 'Check In'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}