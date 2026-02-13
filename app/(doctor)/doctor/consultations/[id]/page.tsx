'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Clock,
    User,
    Calendar,
    FileText,
    Pill,
    TestTube,
    CheckCircle,
    AlertCircle,
    Activity,
    Heart,
    Thermometer,
    Scale
} from 'lucide-react'
import Link from 'next/link'

interface Consultation {
    id: string
    appointment_id: string
    child_id: string
    doctor_id: string
    status: 'in_progress' | 'completed' | 'cancelled'
    started_at: string
    completed_at: string | null
    diagnosis: string | null
    treatment: string | null
    notes: string | null
    child: {
        full_name: string
        date_of_birth: string
        gender: string
        medical_notes: string | null
    } | null
    doctor: {
        full_name: string
        specialty: string
    } | null
    appointment: {
        id: string
        scheduled_at: string
        reason: string
        check_in: {
            vitals: any
        } | null
    } | null
}

export default function ConsultationPage() {
    const params = useParams()
    const router = useRouter()
    const consultationId = params.id as string

    const [consultation, setConsultation] = useState<Consultation | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [diagnosis, setDiagnosis] = useState('')
    const [treatment, setTreatment] = useState('')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        fetchConsultation()
    }, [consultationId])

    async function fetchConsultation() {
        try {
            setLoading(true)
            const supabase = createClient()

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Fetch consultation with related data
            const { data, error } = await supabase
                .from('consultations')
                .select(`
                    *,
                    child:children (
                        full_name,
                        date_of_birth,
                        gender,
                        medical_notes
                    ),
                    doctor:doctors (
                        full_name:profiles!inner(full_name),
                        specialty
                    ),
                    appointment:appointments (
                        id,
                        scheduled_at,
                        reason,
                        check_in:check_ins (
                            vitals
                        )
                    )
                `)
                .eq('id', consultationId)
                .single()

            if (error) throw error

            setConsultation(data)
            setDiagnosis(data.diagnosis || '')
            setTreatment(data.treatment || '')
            setNotes(data.notes || '')
        } catch (err: any) {
            console.error('Error fetching consultation:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function completeConsultation() {
        try {
            setSaving(true)
            const supabase = createClient()

            // Update consultation
            const { error } = await supabase
                .from('consultations')
                .update({
                    diagnosis,
                    treatment,
                    notes,
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', consultationId)

            if (error) throw error

            // Update the associated appointment status (optional)
            if (consultation?.appointment_id) {
                await supabase
                    .from('appointments')
                    .update({ status: 'completed' })
                    .eq('id', consultation.appointment_id)
            }

            // Redirect back to dashboard
            router.push('/doctor/dashboard')
        } catch (err: any) {
            console.error('Error completing consultation:', err)
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    function getAge(dateOfBirth: string) {
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
        return age < 1 ? `${12 + m} mo` : `${age} yrs`
    }

    if (loading) {
        return (
            <div className="space-y-6 pb-20 lg:pb-6">
                <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                    <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
                </div>
            </div>
        )
    }

    if (error || !consultation) {
        return (
            <div className="space-y-6 pb-20 lg:pb-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                        <p className="text-red-800 font-medium mb-4">{error || 'Consultation not found'}</p>
                        <Button onClick={() => router.push('/doctor/dashboard')}>
                            Return to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const child = consultation.child
    const appointment = consultation.appointment
    const vitals = appointment?.check_in?.vitals || {}

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-900">Consultation</h1>
                </div>
                <Badge className={
                    consultation.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-700 border-amber-200'
                        : consultation.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                }>
                    {consultation.status.replace('_', ' ')}
                </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left column – Patient info & vitals */}
                <div className="space-y-4 lg:col-span-1">
                    {/* Patient Card */}
                    <Card className="border-none shadow-lg">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="h-5 w-5 text-blue-600" />
                                Patient Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {child && (
                                <>
                                    <div>
                                        <p className="text-sm text-slate-500">Name</p>
                                        <p className="font-medium text-slate-900">{child.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Age / Gender</p>
                                        <p className="font-medium text-slate-900">
                                            {getAge(child.date_of_birth)} • {child.gender}
                                        </p>
                                    </div>
                                    {child.medical_notes && (
                                        <div>
                                            <p className="text-sm text-slate-500">Medical Notes</p>
                                            <p className="text-sm text-slate-700">{child.medical_notes}</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Appointment Details */}
                    {appointment && (
                        <Card className="border-none shadow-lg">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Calendar className="h-5 w-5 text-purple-600" />
                                    Appointment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-3">
                                <div>
                                    <p className="text-sm text-slate-500">Date & Time</p>
                                    <p className="font-medium text-slate-900">
                                        {new Date(appointment.scheduled_at).toLocaleString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Reason</p>
                                    <p className="text-sm text-slate-700">{appointment.reason}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Vitals */}
                    {Object.keys(vitals).length > 0 && (
                        <Card className="border-none shadow-lg">
                            <CardHeader className="border-b border-slate-100 pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Activity className="h-5 w-5 text-amber-600" />
                                    Vital Signs
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {vitals.temperature && (
                                        <div className="p-3 rounded-xl bg-red-50">
                                            <div className="flex items-center gap-2">
                                                <Thermometer className="h-4 w-4 text-red-600" />
                                                <span className="text-xs text-slate-500">Temperature</span>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{vitals.temperature}°C</p>
                                        </div>
                                    )}
                                    {vitals.weight && (
                                        <div className="p-3 rounded-xl bg-blue-50">
                                            <div className="flex items-center gap-2">
                                                <Scale className="h-4 w-4 text-blue-600" />
                                                <span className="text-xs text-slate-500">Weight</span>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{vitals.weight} kg</p>
                                        </div>
                                    )}
                                    {vitals.blood_pressure && (
                                        <div className="p-3 rounded-xl bg-purple-50">
                                            <div className="flex items-center gap-2">
                                                <Heart className="h-4 w-4 text-purple-600" />
                                                <span className="text-xs text-slate-500">BP</span>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{vitals.blood_pressure}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right column – Consultation notes & actions */}
                <div className="space-y-4 lg:col-span-2">
                    <Card className="border-none shadow-lg">
                        <CardHeader className="border-b border-slate-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-5 w-5 text-teal-600" />
                                Clinical Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Diagnosis
                                </label>
                                <textarea
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="Enter diagnosis..."
                                    disabled={consultation.status === 'completed'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Treatment Plan
                                </label>
                                <textarea
                                    value={treatment}
                                    onChange={(e) => setTreatment(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="Enter treatment plan..."
                                    disabled={consultation.status === 'completed'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    placeholder="Any additional notes..."
                                    disabled={consultation.status === 'completed'}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="secondary"
                            className="h-auto flex-col gap-2 py-4"
                            onClick={() => {/* Navigate to prescription creation with this patient */}}
                        >
                            <Pill className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium">New Prescription</span>
                        </Button>
                        <Button
                            variant="secondary"
                            className="h-auto flex-col gap-2 py-4"
                            onClick={() => {/* Navigate to lab order with this patient */}}
                        >
                            <TestTube className="h-5 w-5 text-amber-600" />
                            <span className="text-sm font-medium">Order Lab Test</span>
                        </Button>
                    </div>

                    {/* Complete Consultation Button */}
                    {consultation.status === 'in_progress' && (
                        <Button
                            onClick={completeConsultation}
                            disabled={saving}
                            className="w-full py-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                                    Completing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Complete Consultation
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}