'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import {
    Search,
    X,
    Clock,
    Users,
    User,
    Activity,
    Thermometer,
    Scale,
    Ruler,
    Heart,
    AlertCircle,
    CheckCircle,
    Play,
    Stethoscope,
    FlaskConical,
    FileText,
    Calendar
} from 'lucide-react'
import QuickPrescriptionModal from '@/components/QuickPrescriptionModal'
import QuickLabOrderModal from '@/components/QuickLabOrderModal'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// ---------- TYPES ----------
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
    const [searchQuery, setSearchQuery] = useState('')

    // ---------- Active consultation state ----------
    const [activeConsultation, setActiveConsultation] = useState<{ id: string } | null>(null)

    // ---------- Modal states ----------
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
    const [showLabOrderModal, setShowLabOrderModal] = useState(false)

    // ---------- Clinical notes for completion ----------
    const [diagnosis, setDiagnosis] = useState('')
    const [treatmentPlan, setTreatmentPlan] = useState('')
    const [followUpDate, setFollowUpDate] = useState('')

    // ---------- HELPER: get child from check-in or appointment ----------
    const getPatientChild = (patient: QueuePatient) => {
        return patient.child || patient.appointment?.child || null
    }

    // ---------- LOAD QUEUE ----------
    const loadQueue = useCallback(async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Get doctor ID
            const { data: doctorData } = await supabase
                .from('doctors')
                .select('id')
                .eq('id', user.id)
                .single()
            if (doctorData) setDoctorId(doctorData.id)

            // Fetch today's check-ins with full relations
            const { data, error } = await supabase
                .from('check_ins')
                .select(`
                    *,
                    appointment:appointments(
                        id,
                        scheduled_for,
                        notes,
                        doctor_id,
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
                const child = getPatientChild(inConsult)

                // 🔥 FIXED: Find consultation by child_id OR appointment_id with better error handling
                try {
                    let consultQuery = supabase
                        .from('consultations')
                        .select('id')
                        .is('completed_at', null)

                    if (child?.id) {
                        consultQuery = consultQuery.eq('child_id', child.id)
                    } else if (inConsult.appointment?.id) {
                        consultQuery = consultQuery.eq('appointment_id', inConsult.appointment.id)
                    }

                    const { data: consult, error: consultError } = await consultQuery.maybeSingle()
                    
                    if (consultError) {
                        console.error('Error fetching consultation:', consultError)
                    } else if (consult) {
                        setActiveConsultation(consult)
                    } else {
                        // No consultation found - create one
                        console.log('No active consultation found, creating new one...')
                        const { data: newConsult, error: createError } = await supabase
                            .from('consultations')
                            .insert({
                                doctor_id: doctorData?.id,
                                child_id: child?.id,
                                appointment_id: inConsult.appointment?.id,
                                started_at: new Date().toISOString(),
                            })
                            .select()
                            .single()

                        if (createError) {
                            console.error('Error creating consultation:', createError)
                        } else if (newConsult) {
                            setActiveConsultation(newConsult)
                        }
                    }
                } catch (err) {
                    console.error('Error in consultation lookup:', err)
                }
            }
        } catch (error) {
            console.error('Error loading queue:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadQueue()
        const supabase = createClient()
        const channel = supabase
            .channel('doctor-queue')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, () => loadQueue())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [loadQueue])

    // ---------- UTILITIES ----------
    function getAge(dateOfBirth: string) {
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
        if (age < 1) {
            const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth())
            return `${months} mo`
        }
        return `${age} yr`
    }

    function getWaitTime(checkedInAt: string) {
        const now = new Date().getTime()
        const checkIn = new Date(checkedInAt).getTime()
        const diff = Math.round((now - checkIn) / 60000)
        if (diff < 1) return 'Just now'
        if (diff === 1) return '1 min'
        if (diff < 60) return `${diff} min`
        const hours = Math.floor(diff / 60)
        const mins = diff % 60
        return `${hours}h ${mins}m`
    }

    // ---------- START CONSULTATION ----------
    async function startConsultation(patient: QueuePatient) {
        try {
            const supabase = createClient()
            const child = getPatientChild(patient)

            // Create consultation record
            const { data: consultation, error: consultError } = await supabase
                .from('consultations')
                .insert({
                    doctor_id: doctorId,
                    child_id: child?.id,
                    appointment_id: patient.appointment?.id,
                    started_at: new Date().toISOString(),
                    // status: 'in_progress' // optional
                })
                .select()
                .single()

            if (consultError) throw consultError

            // Update check-in status
            await supabase
                .from('check_ins')
                .update({ status: 'in_consultation' })
                .eq('id', patient.id)

            setActivePatient(patient)
            setActiveConsultation(consultation)
            setDiagnosis('')
            setTreatmentPlan('')
            setFollowUpDate('')

            loadQueue()
        } catch (error: any) {
            console.error('Error starting consultation:', error)
            alert(`Failed to start consultation: ${error.message}`)
        }
    }

    // ---------- COMPLETE CONSULTATION ----------
    async function completeConsultation() {
        if (!activePatient) {
            alert('No active patient found.')
            return
        }

        if (!activeConsultation) {
            alert('No active consultation found. Please try refreshing the page.')
            return
        }

        if (!diagnosis.trim()) {
            alert('Please enter a diagnosis.')
            return
        }

        try {
            const supabase = createClient()

            // 1. Update consultation with clinical data
            const { error: updateError } = await supabase
                .from('consultations')
                .update({
                    completed_at: new Date().toISOString(),
                    diagnosis: diagnosis.trim(),
                    treatment_plan: treatmentPlan.trim() || null,
                    follow_up_date: followUpDate || null,
                    notes: activePatient.notes,
                })
                .eq('id', activeConsultation.id)

            if (updateError) throw updateError

            // 2. Update check-in status
            await supabase
                .from('check_ins')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', activePatient.id)

            // 3. Update appointment status if exists
            if (activePatient.appointment?.id) {
                await supabase
                    .from('appointments')
                    .update({ status: 'completed' })
                    .eq('id', activePatient.appointment.id)
            }

            // 4. Clear active state
            setActivePatient(null)
            setActiveConsultation(null)
            setDiagnosis('')
            setTreatmentPlan('')
            setFollowUpDate('')

            loadQueue()
        } catch (error: any) {
            console.error('Error completing consultation:', error)
            alert(`Failed to complete consultation: ${error.message}`)
        }
    }

    // ---------- FILTERING & SEARCH ----------
    const filteredQueue = filter === 'all' ? queue : queue.filter(p => p.status === filter)
    const searchedQueue = useMemo(() => {
        if (!searchQuery.trim()) return filteredQueue
        const query = searchQuery.toLowerCase()
        return filteredQueue.filter(patient => {
            const child = getPatientChild(patient)
            return (
                child?.full_name?.toLowerCase().includes(query) ||
                child?.caregiver?.profiles?.full_name?.toLowerCase().includes(query) ||
                patient.reason?.toLowerCase().includes(query) ||
                String(patient.queue_number).includes(query) ||
                child?.gender?.toLowerCase().includes(query)
            )
        })
    }, [filteredQueue, searchQuery])

    const waitingCount = queue.filter(p => p.status === 'waiting').length
    const inConsultCount = queue.filter(p => p.status === 'in_consultation').length

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent" />
                    <p className="mt-4 text-sm text-slate-500">Loading queue...</p>
                </div>
            </div>
        )
    }

    // ---------- RENDER ----------
    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Modals with consultation ID */}
            <QuickPrescriptionModal
                open={showPrescriptionModal}
                onClose={() => setShowPrescriptionModal(false)}
                doctorId={doctorId || ''}
                preSelectedChildId={activePatient ? getPatientChild(activePatient)?.id : undefined}
                consultationId={activeConsultation?.id}
            />
            <QuickLabOrderModal
                open={showLabOrderModal}
                onClose={() => setShowLabOrderModal(false)}
                doctorId={doctorId || ''}
                preSelectedChildId={activePatient ? getPatientChild(activePatient)?.id : undefined}
                consultationId={activeConsultation?.id}
            />

            {/* Page Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
                        Patient Queue
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage your patient consultations in real time
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                    Live updates
                </div>
            </div>

            {/* Active Consultation Card */}
            {activePatient && (() => {
                const child = getPatientChild(activePatient)
                return (
                    <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-white shadow-xl ring-1 ring-slate-200/80">
                        <div className="h-2 w-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600" />
                        <CardHeader className="border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                                    <Stethoscope className="h-5 w-5 text-purple-700" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-800">
                                        Current Consultation
                                    </CardTitle>
                                    <p className="text-xs text-slate-500">
                                        Started {getWaitTime(activePatient.checked_in_at)} ago
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Patient Header */}
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex gap-4">
                                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 text-4xl shadow-inner">
                                        {child?.gender === 'male' ? '👦' : '👧'}
                                    </div>
                                    <div className="space-y-1.5">
                                        <h2 className="text-2xl font-bold text-slate-800">
                                            {child?.full_name || 'Unknown'}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-2 text-sm">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                                                {child?.date_of_birth ? getAge(child.date_of_birth) : ''}
                                            </span>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 capitalize">
                                                {child?.gender || 'Not specified'}
                                            </span>
                                            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                                                <User className="h-3.5 w-3.5" />
                                                {child?.caregiver?.profiles?.full_name || 'No caregiver'}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="h-4 w-4 text-slate-400" />
                                            <span>Reason: {activePatient.reason}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Vitals Grid */}
                                {activePatient.vitals && Object.values(activePatient.vitals).some(v => v) && (
                                    <div className="rounded-2xl bg-slate-50 p-5 shadow-inner">
                                        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                                            Vitals
                                        </p>
                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            {activePatient.vitals.temperature && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                                                        <Thermometer className="h-4 w-4 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Temp</p>
                                                        <p className="font-semibold text-slate-800">{activePatient.vitals.temperature}°C</p>
                                                    </div>
                                                </div>
                                            )}
                                            {activePatient.vitals.weight && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                                        <Scale className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Weight</p>
                                                        <p className="font-semibold text-slate-800">{activePatient.vitals.weight} kg</p>
                                                    </div>
                                                </div>
                                            )}
                                            {activePatient.vitals.height && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                                                        <Ruler className="h-4 w-4 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">Height</p>
                                                        <p className="font-semibold text-slate-800">{activePatient.vitals.height} cm</p>
                                                    </div>
                                                </div>
                                            )}
                                            {activePatient.vitals.blood_pressure && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                                        <Heart className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500">BP</p>
                                                        <p className="font-semibold text-slate-800">{activePatient.vitals.blood_pressure}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Medical Notes */}
                            {child?.medical_notes && (
                                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-200">
                                            <AlertCircle className="h-4 w-4 text-amber-700" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-amber-800">Medical Notes</p>
                                            <p className="mt-1 text-sm text-amber-700">{child.medical_notes}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Clinical Documentation - FIXED: required diagnosis */}
                            <div className="mt-6 space-y-4 border-t pt-6">
                                <h3 className="font-semibold text-slate-800">Clinical Documentation</h3>
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="diagnosis" className="text-slate-700">
                                            Diagnosis <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="diagnosis"
                                            value={diagnosis}
                                            onChange={(e) => setDiagnosis(e.target.value)}
                                            placeholder="e.g., Acute otitis media"
                                            className="border-slate-300 focus:border-purple-500 focus:ring-purple-500/20"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="treatmentPlan" className="text-slate-700">
                                            Treatment Plan
                                        </Label>
                                        <Textarea
                                            id="treatmentPlan"
                                            value={treatmentPlan}
                                            onChange={(e) => setTreatmentPlan(e.target.value)}
                                            placeholder="e.g., Amoxicillin 500mg tid for 7 days"
                                            rows={2}
                                            className="border-slate-300 focus:border-purple-500 focus:ring-purple-500/20"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="followUp" className="text-slate-700">
                                            Follow-up Date (optional)
                                        </Label>
                                        <Input
                                            id="followUp"
                                            type="date"
                                            value={followUpDate}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                            className="border-slate-300 focus:border-purple-500 focus:ring-purple-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Button
                                    onClick={() => setShowPrescriptionModal(true)}
                                    className="flex-1 gap-2 bg-teal-600 text-white hover:bg-teal-700"
                                >
                                    <FileText className="h-4 w-4" />
                                    Prescription
                                </Button>
                                <Button
                                    onClick={() => setShowLabOrderModal(true)}
                                    variant="secondary"
                                    className="flex-1 gap-2 border-amber-500 text-amber-700 hover:bg-amber-50"
                                >
                                    <FlaskConical className="h-4 w-4" />
                                    Lab Order
                                </Button>
                                <Button
                                    onClick={completeConsultation}
                                    disabled={!diagnosis.trim() || !activeConsultation}
                                    className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Complete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )
            })()}

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                        filter === 'all'
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <Users className="h-4 w-4" />
                    All ({queue.length})
                </button>
                <button
                    onClick={() => setFilter('waiting')}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                        filter === 'waiting'
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <Clock className="h-4 w-4" />
                    Waiting ({waitingCount})
                </button>
                <button
                    onClick={() => setFilter('in_consultation')}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                        filter === 'in_consultation'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <Activity className="h-4 w-4" />
                    In Consultation ({inConsultCount})
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by patient, caregiver, reason, or queue #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/30"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Search Result Summary */}
            {searchQuery && (
                <p className="text-sm text-slate-600">
                    Found <span className="font-semibold text-purple-700">{searchedQueue.length}</span> patient{searchedQueue.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                </p>
            )}

            {/* Queue List */}
            <Card className="overflow-hidden border-0 bg-white shadow-xl ring-1 ring-slate-200/80">
                <CardContent className="p-0">
                    {searchedQueue.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                                {searchQuery ? (
                                    <Search className="h-8 w-8 text-slate-400" />
                                ) : (
                                    <Users className="h-8 w-8 text-slate-400" />
                                )}
                            </div>
                            <p className="mt-4 text-lg font-medium text-slate-700">
                                {searchQuery ? 'No matching patients' : 'No patients in queue'}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {searchQuery
                                    ? 'Try adjusting your search term'
                                    : 'New patients will appear here after check-in'}
                            </p>
                            {searchQuery && (
                                <Button
                                    onClick={() => setSearchQuery('')}
                                    variant="secondary"
                                    className="mt-6 border-slate-300 text-slate-700"
                                >
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {searchedQueue.map((patient) => {
                                const child = getPatientChild(patient)
                                const isActive = activePatient?.id === patient.id
                                return (
                                    <div
                                        key={patient.id}
                                        className={`group relative transition-all hover:bg-slate-50/80 ${
                                            isActive ? 'bg-purple-50/50' : ''
                                        }`}
                                    >
                                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-start gap-4 sm:items-center">
                                                {/* Queue Number Badge */}
                                                <div
                                                    className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-xl font-bold shadow-sm ${
                                                        patient.status === 'in_consultation'
                                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                                            : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                                                    }`}
                                                >
                                                    #{patient.queue_number}
                                                </div>

                                                {/* Patient Info */}
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold text-slate-800">
                                                            {child?.full_name || 'Unknown'}
                                                        </h3>
                                                        {patient.status === 'in_consultation' && (
                                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                                In Session
                                                            </Badge>
                                                        )}
                                                        {isActive && (
                                                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                                                                Current
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                                                        <span className="flex items-center gap-1 text-slate-600">
                                                            {child?.gender === 'male' ? '👦' : '👧'}
                                                            {child?.date_of_birth ? getAge(child.date_of_birth) : ''}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-slate-600">
                                                            <User className="h-3.5 w-3.5 text-slate-400" />
                                                            {child?.caregiver?.profiles?.full_name || 'No caregiver'}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-slate-600">
                                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                            Wait: {getWaitTime(patient.checked_in_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500">
                                                        <span className="font-medium">Reason:</span> {patient.reason}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            {patient.status === 'waiting' && !activePatient && (
                                                <Button
                                                    onClick={() => startConsultation(patient)}
                                                    className="ml-auto gap-2 bg-purple-600 text-white shadow-sm transition-all hover:bg-purple-700 hover:shadow-md"
                                                >
                                                    <Play className="h-4 w-4 fill-white" />
                                                    Start
                                                </Button>
                                            )}
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