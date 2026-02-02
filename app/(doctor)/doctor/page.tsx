'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import QuickPrescriptionModal from '@/components/QuickPrescriptionModal'
import QuickLabOrderModal from '@/components/QuickLabOrderModal'
import {
    Stethoscope,
    Users,
    Clock,
    CheckCircle,
    FlaskConical,
    ClipboardList,
    FileText,
    TestTube,
    Calendar,
    ChevronRight,
    Play,
    Thermometer,
    Scale,
    AlertCircle
} from 'lucide-react'

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
        <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-6">
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
                    <CardContent className="flex items-center gap-2 p-3">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Welcome Header - Compact on Mobile */}
            <div className="rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 p-4 text-white shadow-lg lg:rounded-2xl lg:p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold lg:text-2xl">Doctor Dashboard</h1>
                        <p className="mt-0.5 text-sm text-purple-100 lg:mt-1">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <Link href="/doctor/queue">
                        <Button size="sm" className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm">
                            <Users className="mr-1.5 h-4 w-4" />
                            <span className="hidden sm:inline">View </span>Queue
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid - Compact on Mobile */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 lg:h-12 lg:w-12">
                                <Clock className="h-5 w-5 text-amber-600 lg:h-6 lg:w-6" />
                                {stats.waitingForMe > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">Waiting</p>
                                <p className="text-2xl font-bold text-amber-600 lg:text-3xl">{stats.waitingForMe}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 lg:h-12 lg:w-12">
                                <CheckCircle className="h-5 w-5 text-emerald-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">Today</p>
                                <p className="text-2xl font-bold text-emerald-600 lg:text-3xl">{stats.completedToday}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 lg:h-12 lg:w-12">
                                <Stethoscope className="h-5 w-5 text-blue-600 lg:h-6 lg:w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">Avg Time</p>
                                <p className="text-2xl font-bold text-blue-600 lg:text-3xl">{stats.avgConsultTime}m</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardContent className="p-3 lg:p-5">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 lg:h-12 lg:w-12">
                                <FlaskConical className="h-5 w-5 text-purple-600 lg:h-6 lg:w-6" />
                                {stats.pendingLabResults > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-purple-500"></span>
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 lg:text-sm">Lab</p>
                                <p className="text-2xl font-bold text-purple-600 lg:text-3xl">{stats.pendingLabResults}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions - Horizontal scroll on mobile */}
            <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible">
                <Link href="/doctor/queue" className="flex-shrink-0">
                    <Button variant="secondary" className="h-auto flex-col gap-1.5 px-5 py-3 lg:w-full lg:gap-2 lg:py-4">
                        <ClipboardList className="h-5 w-5 text-purple-600" />
                        <span className="text-xs font-medium lg:text-sm">Queue</span>
                    </Button>
                </Link>
                <Button
                    variant="secondary"
                    className="h-auto flex-shrink-0 flex-col gap-1.5 px-5 py-3 lg:gap-2 lg:py-4"
                    onClick={() => setShowPrescriptionModal(true)}
                >
                    <FileText className="h-5 w-5 text-teal-600" />
                    <span className="text-xs font-medium lg:text-sm">Prescription</span>
                </Button>
                <Button
                    variant="secondary"
                    className="h-auto flex-shrink-0 flex-col gap-1.5 px-5 py-3 lg:gap-2 lg:py-4"
                    onClick={() => setShowLabOrderModal(true)}
                >
                    <TestTube className="h-5 w-5 text-amber-600" />
                    <span className="text-xs font-medium lg:text-sm">Lab Test</span>
                </Button>
                <Link href="/doctor/schedule" className="flex-shrink-0">
                    <Button variant="secondary" className="h-auto flex-col gap-1.5 px-5 py-3 lg:w-full lg:gap-2 lg:py-4">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <span className="text-xs font-medium lg:text-sm">Schedule</span>
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                {/* Patient Queue */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
                        <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                            <Users className="h-5 w-5 text-purple-600" />
                            Next Patients
                        </CardTitle>
                        <Link href="/doctor/queue">
                            <Badge className="cursor-pointer bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                                All <ChevronRight className="ml-0.5 h-3 w-3" />
                            </Badge>
                        </Link>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 lg:px-6 lg:pb-6">
                        {queue.length === 0 ? (
                            <div className="py-8 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <Users className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500">No patients waiting</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {queue.slice(0, 5).map((patient) => (
                                    <div
                                        key={patient.id}
                                        className={`rounded-xl border p-3 transition-all lg:p-4 ${patient.status === 'in_consultation'
                                            ? 'border-purple-200 bg-purple-50/50'
                                            : 'border-slate-200 bg-slate-50/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white lg:h-12 lg:w-12 lg:text-base ${patient.status === 'in_consultation'
                                                ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                                                : 'bg-gradient-to-br from-amber-400 to-orange-500'
                                                }`}>
                                                #{patient.queue_number}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-slate-800 lg:text-base">
                                                    {patient.child?.full_name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {patient.child?.date_of_birth ? getAge(patient.child.date_of_birth) : ''} • {patient.reason}
                                                </p>
                                                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                                                    <Clock className="h-3 w-3" />
                                                    {getWaitTime(patient.checked_in_at)}
                                                </p>
                                            </div>

                                            {patient.status === 'waiting' ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => startConsultation(patient)}
                                                    className="h-8 bg-purple-600 px-3 hover:bg-purple-700"
                                                >
                                                    <Play className="mr-1 h-3.5 w-3.5" />
                                                    Start
                                                </Button>
                                            ) : (
                                                <Badge className="bg-purple-100 text-purple-700">Active</Badge>
                                            )}
                                        </div>

                                        {patient.vitals && Object.values(patient.vitals).some(v => v) && (
                                            <div className="mt-2.5 flex flex-wrap gap-2 border-t border-slate-200 pt-2.5">
                                                {patient.vitals.temperature && (
                                                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] text-red-700">
                                                        <Thermometer className="h-3 w-3" />
                                                        {patient.vitals.temperature}°C
                                                    </span>
                                                )}
                                                {patient.vitals.weight && (
                                                    <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">
                                                        <Scale className="h-3 w-3" />
                                                        {patient.vitals.weight} kg
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
                    <CardHeader className="flex flex-row items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
                        <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                            Recent
                        </CardTitle>
                        <Link href="/doctor/consultations">
                            <Badge className="cursor-pointer bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                All <ChevronRight className="ml-0.5 h-3 w-3" />
                            </Badge>
                        </Link>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 lg:px-6 lg:pb-6">
                        {recentConsultations.length === 0 ? (
                            <div className="py-8 text-center">
                                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                    <ClipboardList className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500">No consultations today</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {recentConsultations.map((consult) => (
                                    <div
                                        key={consult.id}
                                        className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 lg:p-4"
                                    >
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {consult.child?.full_name || 'Unknown'}
                                            </p>
                                            <p className="truncate text-xs text-slate-500">
                                                {consult.diagnosis || 'Consultation completed'}
                                            </p>
                                        </div>
                                        <p className="flex-shrink-0 text-xs text-slate-400">
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