'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import QuickPrescriptionModal from '@/components/QuickPrescriptionModal'
import QuickLabOrderModal from '@/components/QuickLabOrderModal'

interface QueueStats {
    waitingForMe: number
    completedToday: number
    avgConsultTime: number
    pendingLabResults: number
}

interface QueuePatient {
    id: string
    child_id: string
    queue_number: number
    checked_in_at: string
    status: string
    reason: string
    vitals: {
        temperature?: string
        weight?: string
        height?: string
        blood_pressure?: string
    } | null
    appointment: {
        id: string
        child_id: string
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

interface RecentConsultation {
    id: string
    completed_at: string
    diagnosis: string
    child: {
        full_name: string
    } | null
}

export default function DoctorDashboard() {
    const [stats, setStats] = useState<QueueStats>({
        waitingForMe: 0,
        completedToday: 0,
        avgConsultTime: 0,
        pendingLabResults: 0,
    })
    const [queue, setQueue] = useState<QueuePatient[]>([])
    const [recentConsultations, setRecentConsultations] = useState<RecentConsultation[]>([])
    const [loading, setLoading] = useState(true)
    const [doctorId, setDoctorId] = useState<string | null>(null)
    const [debugInfo, setDebugInfo] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    
    // Modal states
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
    const [showLabOrderModal, setShowLabOrderModal] = useState(false)

    const loadDashboardData = useCallback(async () => {
        setLoading(true)
        setError(null)
        setDebugInfo('')
        
        try {
            const supabase = createClient()
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                setError('Not authenticated')
                return
            }

            // Get doctor ID
            const { data: doctorData, error: doctorError } = await supabase
                .from('doctors')
                .select('id, specialty')
                .eq('id', user.id)
                .single()

            if (doctorError) {
                setError(`Doctor profile error: ${doctorError.message}`)
                console.error('Doctor error:', doctorError)
            }

            if (doctorData) {
                setDoctorId(doctorData.id)
                setDebugInfo(`Doctor ID: ${doctorData.id}`)
            } else {
                setError('No doctor profile found. Make sure you have a record in the doctors table.')
                return
            }

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Get waiting patients with full details
            const { data: waitingPatients, error: queueError } = await supabase
                .from('check_ins')
                .select(`
          *,
          appointment:appointments(id, child_id, doctor_id),
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

            if (queueError) {
                setError(`Queue error: ${queueError.message}`)
                console.error('Queue error:', queueError)
            }

            setDebugInfo(prev => prev + ` | Waiting/In consultation: ${waitingPatients?.length || 0}`)

            // Filter patients waiting for this doctor or unassigned
            const myQueue = (waitingPatients || []).filter(p =>
                !p.appointment?.doctor_id || p.appointment?.doctor_id === doctorData?.id
            )
            
            setDebugInfo(prev => prev + ` | My queue: ${myQueue.length}`)
            setQueue(myQueue)

            // Get completed consultations today
            const { data: completedToday, error: consultError } = await supabase
                .from('consultations')
                .select('id, completed_at, diagnosis, child:children(full_name)')
                .eq('doctor_id', doctorData?.id || '')
                .gte('completed_at', today.toISOString())
                .order('completed_at', { ascending: false })

            if (consultError) {
                console.error('Consultations error:', consultError)
            }

            const mappedConsultations: RecentConsultation[] = (completedToday || []).slice(0, 5).map(c => ({
                id: c.id,
                completed_at: c.completed_at,
                diagnosis: c.diagnosis,
                child: Array.isArray(c.child) ? c.child[0] : c.child,
            }))
            setRecentConsultations(mappedConsultations)

            // FIX: Get pending lab results (completed tests not yet reviewed)
            const { data: pendingLabs, error: labError } = await supabase
                .from('lab_orders')
                .select('id, status, reviewed_at, doctor_id, test_type')
                .eq('doctor_id', doctorData?.id || '')
                .eq('status', 'completed')
                .is('reviewed_at', null)

            if (labError) {
                console.error('Pending labs error:', labError)
            }
            
            console.log('🔬 Pending lab results for doctor:', doctorData?.id)
            console.log('🔬 Query returned:', pendingLabs?.length || 0, 'pending lab results')
            console.log('🔬 Pending labs details:', pendingLabs)

            // Calculate stats
            setStats({
                waitingForMe: myQueue.filter(p => p.status === 'waiting').length,
                completedToday: (completedToday || []).length,
                avgConsultTime: 15,
                pendingLabResults: (pendingLabs || []).length, // FIX: Use the actual count
            })
        } catch (error: any) {
            console.error('Error loading dashboard data:', error)
            setError(error.message || 'Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDashboardData()

        const supabase = createClient()
        const channel = supabase
            .channel('doctor-dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'check_ins' },
                () => loadDashboardData()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lab_orders' },
                () => loadDashboardData()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadDashboardData])

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
            return `${months} mo`
        }
        return `${age} yrs`
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

    async function startConsultation(checkIn: QueuePatient) {
        try {
            const supabase = createClient()

            await supabase
                .from('check_ins')
                .update({ status: 'in_consultation' })
                .eq('id', checkIn.id)

            const consultId = checkIn.appointment?.id || checkIn.child_id
            window.location.href = `/doctor/consultations/${consultId}`
        } catch (error) {
            console.error('Error starting consultation:', error)
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
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Modals */}
            {doctorId && (
                <>
                    <QuickPrescriptionModal
                        open={showPrescriptionModal}
                        onClose={() => setShowPrescriptionModal(false)}
                        doctorId={doctorId}
                    />
                    <QuickLabOrderModal
                        open={showLabOrderModal}
                        onClose={() => setShowLabOrderModal(false)}
                        doctorId={doctorId}
                    />
                </>
            )}

           
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-red-800">
                            ⚠️ Error: {error}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Welcome Header */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 p-6 text-white shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
                        <p className="mt-1 text-purple-100">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/doctor/queue">
                            <Button className="bg-white text-purple-600 hover:bg-purple-50">
                                📋 View Full Queue
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-200 text-2xl">
                                <span className="relative">
                                    ⏳
                                    {stats.waitingForMe > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-500"></span>
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Waiting for Me</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.waitingForMe}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-200 text-2xl">
                                ✅
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Completed Today</p>
                                <p className="text-3xl font-bold text-green-600">{stats.completedToday}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 text-2xl">
                                ⏱️
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Avg Consult Time</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.avgConsultTime}m</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 text-2xl">
                                <span className="relative">
                                    🔬
                                    {stats.pendingLabResults > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-purple-500"></span>
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pending Lab Results</p>
                                <p className="text-3xl font-bold text-purple-600">{stats.pendingLabResults}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Link href="/doctor/queue">
                            <Button variant="secondary" className="h-auto w-full flex-col gap-2 py-4">
                                <span className="text-2xl">📋</span>
                                <span>Patient Queue</span>
                            </Button>
                        </Link>
                        <Button 
                            variant="secondary" 
                            className="h-auto flex-col gap-2 py-4"
                            onClick={() => setShowPrescriptionModal(true)}
                        >
                            <span className="text-2xl">📝</span>
                            <span>Quick Prescription</span>
                        </Button>
                        <Button 
                            variant="secondary" 
                            className="h-auto flex-col gap-2 py-4"
                            onClick={() => setShowLabOrderModal(true)}
                        >
                            <span className="text-2xl">🧪</span>
                            <span>Order Lab Test</span>
                        </Button>
                        <Link href="/doctor/schedule">
                            <Button variant="secondary" className="h-auto w-full flex-col gap-2 py-4">
                                <span className="text-2xl">📅</span>
                                <span>My Schedule</span>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Patient Queue */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Next Patients</CardTitle>
                        <Link href="/doctor/queue">
                            <Button variant="ghost" size="sm">
                                View All →
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {queue.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-3xl">✨</p>
                                <p className="mt-2 text-slate-500">No patients waiting</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {queue.slice(0, 5).map((patient) => (
                                    <div
                                        key={patient.id}
                                        className={`rounded-xl border p-4 transition-all ${patient.status === 'in_consultation'
                                                ? 'border-purple-200 bg-purple-50/50'
                                                : 'border-slate-200 bg-slate-50/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${patient.status === 'in_consultation'
                                                        ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                                                        : 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                    }`}>
                                                    #{patient.queue_number}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {patient.child?.full_name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {patient.child?.date_of_birth ? getAge(patient.child.date_of_birth) : ''} •{' '}
                                                        {patient.reason}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        Wait: {getWaitTime(patient.checked_in_at)}
                                                    </p>
                                                </div>
                                            </div>

                                            {patient.status === 'waiting' ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => startConsultation(patient)}
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                >
                                                    Start
                                                </Button>
                                            ) : (
                                                <Badge variant="purple">In Session</Badge>
                                            )}
                                        </div>

                                        {patient.vitals && Object.values(patient.vitals).some(v => v) && (
                                            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                                                {patient.vitals.temperature && (
                                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                                        🌡️ {patient.vitals.temperature}°C
                                                    </span>
                                                )}
                                                {patient.vitals.weight && (
                                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                                        ⚖️ {patient.vitals.weight} kg
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

                {/* Recent Consultations */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Recent Consultations</CardTitle>
                        <Link href="/doctor/consultations">
                            <Button variant="ghost" size="sm">
                                View All →
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentConsultations.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-3xl">📋</p>
                                <p className="mt-2 text-slate-500">No consultations yet today</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentConsultations.map((consult) => (
                                    <div
                                        key={consult.id}
                                        className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg">
                                                ✅
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    {consult.child?.full_name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {consult.diagnosis || 'Consultation completed'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400">
                                            {new Date(consult.completed_at).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
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