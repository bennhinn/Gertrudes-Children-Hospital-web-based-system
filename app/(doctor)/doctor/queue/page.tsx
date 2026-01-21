'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface QueuePatient {
    id: string
    child_id: string
    queue_number: number
    checked_in_at: string
    status: 'waiting' | 'in_consultation' | 'completed'
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
        notes: string | null
        doctor_id: string | null
    } | null
    child: {
        id: string
        full_name: string
        date_of_birth: string
        gender: string
        medical_notes: string | null
        caregiver?: {
            id: string
            profiles: {
                full_name: string
                phone: string
            }
        }
    } | null
}

type FilterStatus = 'all' | 'waiting' | 'in_consultation'

export default function DoctorQueuePage() {
    const [queue, setQueue] = useState<QueuePatient[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterStatus>('all')
    const [activePatient, setActivePatient] = useState<QueuePatient | null>(null)
    const [doctorId, setDoctorId] = useState<string | null>(null)

    const loadQueue = useCallback(async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Get doctor ID - doctors.id references profiles.id directly
            const { data: doctorData } = await supabase
                .from('doctors')
                .select('id')
                .eq('id', user.id)
                .single()

            if (doctorData) {
                setDoctorId(doctorData.id)
            }

            // Get today's queue with proper joins
            const { data, error } = await supabase
                .from('check_ins')
                .select(`
          *,
          appointment:appointments(
            id,
            scheduled_for,
            notes,
            doctor_id
          ),
          child:children(
            id, 
            full_name, 
            date_of_birth, 
            gender, 
            medical_notes,
            caregiver:caregivers(
              id,
              profiles(full_name, phone)
            )
          )
        `)
                .gte('checked_in_at', today.toISOString())
                .in('status', ['waiting', 'in_consultation'])
                .order('queue_number', { ascending: true })

            if (error) throw error

            // Filter for this doctor or unassigned
            const myQueue = (data || []).filter(p =>
                !p.appointment?.doctor_id || p.appointment?.doctor_id === doctorData?.id
            )

            setQueue(myQueue)

            // Set active patient if one is in consultation
            const inConsult = myQueue.find(p => p.status === 'in_consultation')
            if (inConsult) {
                setActivePatient(inConsult)
            }
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
            .channel('doctor-queue')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'check_ins' },
                () => loadQueue()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadQueue])

    function getAge(dateOfBirth: string) {
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        if (age < 1) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
            return `${months} months`
        }
        return `${age} years old`
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

    async function startConsultation(patient: QueuePatient) {
        try {
            const supabase = createClient()

            await supabase
                .from('check_ins')
                .update({ status: 'in_consultation' })
                .eq('id', patient.id)

            setActivePatient(patient)
            loadQueue()
        } catch (error) {
            console.error('Error starting consultation:', error)
        }
    }

    async function completeConsultation() {
        if (!activePatient) return

        try {
            const supabase = createClient()

            // Create consultation record
            await supabase
                .from('consultations')
                .insert({
                    appointment_id: activePatient.appointment?.id,
                    doctor_id: doctorId,
                    child_id: activePatient.child?.id,
                    completed_at: new Date().toISOString(),
                    diagnosis: 'General checkup completed', // TODO: Add proper form
                    notes: '',
                })

            // Update check-in status
            await supabase
                .from('check_ins')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', activePatient.id)

            // Update appointment status if exists
            if (activePatient.appointment?.id) {
                await supabase
                    .from('appointments')
                    .update({ status: 'completed' })
                    .eq('id', activePatient.appointment.id)
            }

            setActivePatient(null)
            loadQueue()
        } catch (error) {
            console.error('Error completing consultation:', error)
        }
    }

    const filteredQueue = filter === 'all'
        ? queue
        : queue.filter(p => p.status === filter)

    const waitingCount = queue.filter(p => p.status === 'waiting').length
    const inConsultCount = queue.filter(p => p.status === 'in_consultation').length

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 animate-pulse rounded-2xl bg-slate-200"></div>
                <div className="h-64 animate-pulse rounded-2xl bg-slate-200"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Patient Queue</h1>
                    <p className="text-slate-500">Manage your patient consultations</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                    </span>
                    <span className="text-sm text-slate-500">Live updates</span>
                </div>
            </div>

            {/* Active Patient Card */}
            {activePatient && (
                <Card className="border-2 border-purple-500 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">🩺</span>
                            Current Consultation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-100 text-4xl">
                                    {activePatient.child?.gender === 'male' ? '👦' : '👧'}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">
                                        {activePatient.child?.full_name || 'Unknown'}
                                    </h3>
                                    <p className="text-slate-600">
                                        {activePatient.child?.date_of_birth ? getAge(activePatient.child.date_of_birth) : ''} •{' '}
                                        {activePatient.child?.gender}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Reason: {activePatient.reason}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Caregiver: {activePatient.child?.caregiver?.profiles?.full_name || 'Unknown'}
                                    </p>
                                </div>
                            </div>

                            {/* Vitals */}
                            {activePatient.vitals && Object.values(activePatient.vitals).some(v => v) && (
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <p className="mb-2 text-sm font-medium text-slate-600">Vitals</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {activePatient.vitals.temperature && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">🌡️</span>
                                                <span className="text-sm font-medium">{activePatient.vitals.temperature}°C</span>
                                            </div>
                                        )}
                                        {activePatient.vitals.weight && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">⚖️</span>
                                                <span className="text-sm font-medium">{activePatient.vitals.weight} kg</span>
                                            </div>
                                        )}
                                        {activePatient.vitals.height && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">📏</span>
                                                <span className="text-sm font-medium">{activePatient.vitals.height} cm</span>
                                            </div>
                                        )}
                                        {activePatient.vitals.blood_pressure && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">💓</span>
                                                <span className="text-sm font-medium">{activePatient.vitals.blood_pressure}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Medical Notes */}
                        {activePatient.child?.medical_notes && (
                            <div className="mt-4 rounded-xl bg-yellow-50 p-4">
                                <p className="text-sm font-medium text-yellow-800">⚠️ Medical Notes</p>
                                <p className="mt-1 text-sm text-yellow-700">{activePatient.child.medical_notes}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Button disabled className="flex-1">
                                📝 Write Prescription
                            </Button>
                            <Button disabled variant="secondary" className="flex-1">
                                🧪 Order Lab Test
                            </Button>
                            <Button
                                onClick={completeConsultation}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                ✅ Complete Consultation
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${filter === 'all'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    All ({queue.length})
                </button>
                <button
                    onClick={() => setFilter('waiting')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${filter === 'waiting'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    Waiting ({waitingCount})
                </button>
                <button
                    onClick={() => setFilter('in_consultation')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${filter === 'in_consultation'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                >
                    In Consultation ({inConsultCount})
                </button>
            </div>

            {/* Queue List */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                    {filteredQueue.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-4xl">✨</p>
                            <p className="mt-4 text-lg font-medium text-slate-600">No patients in queue</p>
                            <p className="text-slate-400">New patients will appear here after check-in</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredQueue.map((patient) => (
                                <div
                                    key={patient.id}
                                    className={`rounded-xl border p-4 transition-all ${patient.status === 'in_consultation'
                                            ? 'border-purple-300 bg-purple-50'
                                            : 'border-slate-200 bg-white hover:shadow-md'
                                        }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white ${patient.status === 'in_consultation'
                                                    ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                                                    : 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                }`}>
                                                #{patient.queue_number}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-800">
                                                        {patient.child?.full_name || 'Unknown'}
                                                    </h3>
                                                    {patient.status === 'in_consultation' && (
                                                        <Badge variant="purple">In Session</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    {patient.child?.gender === 'male' ? '👦' : '👧'}{' '}
                                                    {patient.child?.date_of_birth ? getAge(patient.child.date_of_birth) : ''} •{' '}
                                                    {patient.reason}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    ⏱️ Waiting: {getWaitTime(patient.checked_in_at)}
                                                </p>
                                            </div>
                                        </div>

                                        {patient.status === 'waiting' && !activePatient && (
                                            <Button
                                                onClick={() => startConsultation(patient)}
                                                className="bg-purple-600 hover:bg-purple-700"
                                            >
                                                🩺 Start Consultation
                                            </Button>
                                        )}
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