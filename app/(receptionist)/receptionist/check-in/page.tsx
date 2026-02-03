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
        <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-6">
            {/* Header - Compact on Mobile */}
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold text-slate-800 lg:text-2xl">Patient Check-In</h1>
                    <p className="text-xs text-slate-500 lg:text-sm">Search for a patient or scan their QR code</p>
                </div>
                <Link href="/receptionist">
                    <Button variant="ghost" size="sm" className="h-8 px-2 lg:h-10 lg:px-4">← Back</Button>
                </Link>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700 lg:p-4 lg:text-base">
                    ✅ {success}
                </div>
            )}
            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 lg:p-4 lg:text-base">
                    ❌ {error}
                </div>
            )}

            {/* QR Scanner Placeholder - Smaller on Mobile */}
            <Card className="border-none shadow-lg">
                <CardHeader className="pb-2 px-4 pt-4 lg:px-6 lg:pt-6">
                    <CardTitle className="text-base lg:text-lg">📱 Scan QR Code</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 lg:px-6 lg:pb-6">
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 lg:py-12">
                        <span className="text-4xl lg:text-5xl">📷</span>
                        <p className="mt-3 text-sm text-slate-500 lg:mt-4 lg:text-base">QR Scanner Coming Soon</p>
                        <p className="text-xs text-slate-400 lg:text-sm">Use manual search below for now</p>
                    </div>
                </CardContent>
            </Card>

            {/* Manual Search - Optimized for Mobile */}
            <Card className="border-none shadow-lg">
                <CardHeader className="pb-2 px-4 pt-4 lg:px-6 lg:pt-6">
                    <CardTitle className="text-base lg:text-lg">🔍 Search Patient</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 lg:px-6 lg:pb-6">
                    <Input
                        placeholder="Search by patient name, caregiver, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12"
                    />

                    {loading && (
                        <div className="py-6 text-center text-slate-500 lg:py-8">
                            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                            <p className="mt-2 text-sm">Searching...</p>
                        </div>
                    )}

                    {!loading && appointments.length === 0 && searchQuery.length >= 2 && (
                        <div className="py-6 text-center lg:py-8">
                            <p className="text-3xl">🔍</p>
                            <p className="mt-2 text-sm text-slate-500">No appointments found</p>
                        </div>
                    )}

                    {appointments.length > 0 && (
                        <div className="space-y-2 lg:space-y-3">
                            {appointments.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm lg:p-4"
                                >
                                    <div className="flex items-start gap-3 lg:gap-4">
                                        {/* Avatar */}
                                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg lg:h-12 lg:w-12 lg:text-xl">
                                            👶
                                        </div>

                                        {/* Patient Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">
                                                {apt.child?.full_name || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 lg:text-sm">
                                                {apt.child?.date_of_birth ? calculateAge(apt.child.date_of_birth) : ''} •
                                                {apt.caregiver?.profiles?.full_name || 'Unknown'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                <span>📞 {apt.caregiver?.profiles?.phone || 'No phone'}</span>
                                                <span>• 🕐 {formatTime(apt.scheduled_for)}</span>
                                            </div>

                                            {/* Mobile Check-In Button */}
                                            <div className="mt-3 lg:hidden">
                                                <Button
                                                    className="w-full h-10 text-sm"
                                                    onClick={() => handleCheckIn(apt)}
                                                    disabled={checkingIn === apt.id}
                                                >
                                                    {checkingIn === apt.id ? 'Checking in...' : 'Check In'}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Desktop Check-In Button */}
                                        <div className="hidden lg:block shrink-0">
                                            <Button
                                                onClick={() => handleCheckIn(apt)}
                                                disabled={checkingIn === apt.id}
                                            >
                                                {checkingIn === apt.id ? 'Checking in...' : 'Check In'}
                                            </Button>
                                        </div>
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