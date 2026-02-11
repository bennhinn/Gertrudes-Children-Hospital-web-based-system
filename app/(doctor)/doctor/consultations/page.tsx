'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import {
    ClipboardList,
    CheckCircle2,
    Calendar,
    ArrowLeft,
    RefreshCw,
    AlertTriangle,
    Mars,
    Venus,
    User,
    Clipboard,
    Loader2,
} from 'lucide-react'

interface ConsultationData {
    id: string
    completed_at: string | null
    created_at: string
    diagnosis: string
    treatment_plan: string | null
    notes: string | null
    follow_up_date: string | null
    child_name: string
    child_dob: string | null
    child_gender: string | null
    child_medical_notes: string | null
    caregiver_name: string | null
    caregiver_phone: string | null
    prescriptions: Array<{
        id: string
        medication_name: string
        dosage: string
        frequency: string
        duration: string
    }>
}

type DateFilter = 'today' | 'week' | 'month' | 'all'

export default function ConsultationsPage() {
    const [consultations, setConsultations] = useState<ConsultationData[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFilter, setDateFilter] = useState<DateFilter>('all')
    const [selectedConsultation, setSelectedConsultation] = useState<ConsultationData | null>(null)
    const [error, setError] = useState<string | null>(null)

    const loadConsultations = useCallback(async () => {
        // ... (business logic unchanged)
        setLoading(true)
        setError(null)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setError('Not authenticated')
                setLoading(false)
                return
            }

            const { data: doctorData } = await supabase
                .from('doctors')
                .select('id')
                .eq('id', user.id)
                .single()

            if (!doctorData) {
                setError('Doctor profile not found')
                setLoading(false)
                return
            }

            const now = new Date()
            let startDate = new Date()

            switch (dateFilter) {
                case 'today':
                    startDate.setHours(0, 0, 0, 0)
                    break
                case 'week':
                    startDate.setDate(now.getDate() - 7)
                    break
                case 'month':
                    startDate.setMonth(now.getMonth() - 1)
                    break
                case 'all':
                    startDate = new Date('2000-01-01')
                    break
            }

            const { data: consultData, error: consultError } = await supabase
                .from('consultations')
                .select(`
                    id,
                    completed_at,
                    created_at,
                    diagnosis,
                    treatment_plan,
                    notes,
                    follow_up_date,
                    child:children!inner(
                        full_name,
                        date_of_birth,
                        gender,
                        medical_notes,
                        caregiver:caregivers(
                            profiles:profiles!inner(full_name, phone)
                        )
                    )
                `)
                .eq('doctor_id', doctorData.id)
                .not('diagnosis', 'is', null)
                .order('completed_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })

            if (consultError) {
                console.error('Consultation fetch error:', consultError)
                setError(consultError.message)
                setLoading(false)
                return
            }

            const consultIds = (consultData || []).map(c => c.id)
            const { data: prescriptionsData } = await supabase
                .from('prescriptions')
                .select('id, consultation_id, medication_name, dosage, frequency, duration')
                .in('consultation_id', consultIds)

            const transformed: ConsultationData[] = (consultData || [])
                .map((consult: any) => {
                    const child = Array.isArray(consult.child) ? consult.child[0] : consult.child
                    const caregiver = child?.caregiver
                    const caregiverData = Array.isArray(caregiver) ? caregiver[0] : caregiver
                    const profile = caregiverData?.profiles
                    const profileData = Array.isArray(profile) ? profile[0] : profile

                    const consultDate = consult.completed_at || consult.created_at
                    if (new Date(consultDate) < startDate) {
                        return null
                    }

                    const consultPrescriptions = (prescriptionsData || [])
                        .filter(p => p.consultation_id === consult.id)
                        .map(p => ({
                            id: p.id,
                            medication_name: p.medication_name,
                            dosage: p.dosage,
                            frequency: p.frequency,
                            duration: p.duration
                        }))

                    return {
                        id: consult.id,
                        completed_at: consult.completed_at,
                        created_at: consult.created_at,
                        diagnosis: consult.diagnosis || 'No diagnosis',
                        treatment_plan: consult.treatment_plan,
                        notes: consult.notes,
                        follow_up_date: consult.follow_up_date,
                        child_name: child?.full_name || 'Unknown',
                        child_dob: child?.date_of_birth || null,
                        child_gender: child?.gender || null,
                        child_medical_notes: child?.medical_notes || null,
                        caregiver_name: profileData?.full_name || null,
                        caregiver_phone: profileData?.phone || null,
                        prescriptions: consultPrescriptions
                    }
                })
                .filter(Boolean) as ConsultationData[]

            setConsultations(transformed)
            console.log(`Loaded ${transformed.length} consultations`)
        } catch (error: any) {
            console.error('Error loading consultations:', error)
            setError(error.message || 'Failed to load consultations')
        } finally {
            setLoading(false)
        }
    }, [dateFilter])

    useEffect(() => {
        loadConsultations()
    }, [loadConsultations])

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

    function formatDateTime(dateString: string | null) {
        if (!dateString) return { date: 'N/A', time: 'N/A' }
        const date = new Date(dateString)
        return {
            date: date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }),
        }
    }

    const filteredConsultations = consultations.filter(consult => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
            consult.child_name.toLowerCase().includes(query) ||
            consult.diagnosis.toLowerCase().includes(query) ||
            (consult.caregiver_name && consult.caregiver_name.toLowerCase().includes(query))
        )
    })

    const thisWeekCount = consultations.filter(c => {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const consultDate = c.completed_at || c.created_at
        return new Date(consultDate) >= weekAgo
    }).length

    const followUpCount = consultations.filter(c =>
        c.follow_up_date && new Date(c.follow_up_date) > new Date()
    ).length

    const getGenderIcon = (gender: string | null) => {
        if (gender === 'male') return <Mars className="h-5 w-5 text-blue-600" />
        if (gender === 'female') return <Venus className="h-5 w-5 text-pink-600" />
        return <User className="h-5 w-5 text-slate-600" />
    }

    if (loading) {
        return (
            <div className="space-y-6 pb-20 lg:pb-6">
                <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
                <div className="grid gap-4 sm:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Error Display */}
            {error && (
                <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm">
                    <CardContent className="flex items-center gap-3 p-4">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-sm font-medium text-red-800">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Consultation History</h1>
                    <p className="text-slate-500">View and manage past consultations</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-none bg-gradient-to-br from-white to-slate-50 shadow-md transition-shadow hover:shadow-lg">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                            <ClipboardList className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Consultations</p>
                            <p className="text-2xl font-bold text-blue-600">{consultations.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-white to-slate-50 shadow-md transition-shadow hover:shadow-lg">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-green-200 text-green-700">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">This Week</p>
                            <p className="text-2xl font-bold text-green-600">{thisWeekCount}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-white to-slate-50 shadow-md transition-shadow hover:shadow-lg">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Follow-ups Pending</p>
                            <p className="text-2xl font-bold text-purple-600">{followUpCount}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-none bg-white/70 shadow-md backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Input
                                    placeholder="Search by patient, diagnosis, caregiver..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                            className="h-10 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="all">All Time</option>
                        </select>
                        <Button
                            onClick={loadConsultations}
                            variant="secondary"
                            size="sm"
                            className="gap-2 border-slate-200 bg-white hover:bg-slate-50"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* List Column */}
                <Card className="border-none shadow-md">
                    <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ClipboardList className="h-5 w-5 text-purple-600" />
                            {filteredConsultations.length} Consultation{filteredConsultations.length !== 1 ? 's' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        {filteredConsultations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Clipboard className="h-16 w-16 text-slate-300" />
                                <p className="mt-4 text-lg font-medium text-slate-600">No consultations found</p>
                                <p className="text-slate-400">
                                    {consultations.length === 0
                                        ? 'Complete your first consultation to see it here'
                                        : 'Try adjusting your filters'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                {filteredConsultations.map((consult) => {
                                    const consultDate = consult.completed_at || consult.created_at
                                    const { date, time } = formatDateTime(consultDate)
                                    return (
                                        <button
                                            key={consult.id}
                                            onClick={() => setSelectedConsultation(consult)}
                                            className={`group relative w-full rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                                                selectedConsultation?.id === consult.id
                                                    ? 'border-purple-400 bg-gradient-to-r from-purple-50 to-white'
                                                    : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/30'
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                                    consult.child_gender === 'male'
                                                        ? 'bg-blue-100'
                                                        : consult.child_gender === 'female'
                                                        ? 'bg-pink-100'
                                                        : 'bg-slate-100'
                                                }`}>
                                                    {getGenderIcon(consult.child_gender)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="font-semibold text-slate-800">{consult.child_name}</p>
                                                            <p className="text-sm text-slate-600 line-clamp-1">{consult.diagnosis}</p>
                                                        </div>
                                                        {consult.follow_up_date && new Date(consult.follow_up_date) > new Date() && (
                                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                                                Follow-up
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                                        <Calendar className="h-3 w-3" />
                                                        {date} at {time}
                                                        {!consult.completed_at && (
                                                            <span className="ml-2 text-amber-600">(Draft)</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Detail Column */}
                <Card className="border-none shadow-md lg:sticky lg:top-24">
                    <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Clipboard className="h-5 w-5 text-purple-600" />
                            Consultation Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {!selectedConsultation ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <ArrowLeft className="h-16 w-16 text-slate-300" />
                                <p className="mt-4 text-slate-500">Select a consultation to view details</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Patient Info Card */}
                                <div className="rounded-xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-5 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-white shadow-md ${
                                            selectedConsultation.child_gender === 'male'
                                                ? 'text-blue-600'
                                                : selectedConsultation.child_gender === 'female'
                                                ? 'text-pink-600'
                                                : 'text-slate-600'
                                        }`}>
                                            {getGenderIcon(selectedConsultation.child_gender)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-slate-800">
                                                {selectedConsultation.child_name}
                                            </h3>
                                            <p className="flex items-center gap-2 text-sm text-slate-600">
                                                <span>{getAge(selectedConsultation.child_dob)}</span>
                                                {selectedConsultation.child_gender && (
                                                    <>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="capitalize">{selectedConsultation.child_gender}</span>
                                                    </>
                                                )}
                                            </p>
                                            {selectedConsultation.caregiver_name && (
                                                <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                                    <User className="h-3 w-3" />
                                                    {selectedConsultation.caregiver_name}
                                                    {selectedConsultation.caregiver_phone && (
                                                        <> • {selectedConsultation.caregiver_phone}</>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Consultation Date */}
                                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                                    <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                        <Calendar className="h-4 w-4" />
                                        Consultation Date
                                    </p>
                                    <p className="mt-1 text-slate-800">
                                        {(() => {
                                            const consultDate = selectedConsultation.completed_at || selectedConsultation.created_at
                                            const { date, time } = formatDateTime(consultDate)
                                            return `${date} at ${time}`
                                        })()}
                                        {!selectedConsultation.completed_at && (
                                            <span className="ml-2 text-sm text-amber-600">(Not completed)</span>
                                        )}
                                    </p>
                                </div>

                                {/* Diagnosis */}
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Diagnosis</p>
                                    <p className="mt-1 text-slate-800">{selectedConsultation.diagnosis}</p>
                                </div>

                                {/* Treatment Plan */}
                                {selectedConsultation.treatment_plan && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Treatment Plan</p>
                                        <p className="mt-1 whitespace-pre-wrap text-slate-800">{selectedConsultation.treatment_plan}</p>
                                    </div>
                                )}

                                {/* Prescriptions */}
                                {selectedConsultation.prescriptions.length > 0 && (
                                    <div>
                                        <p className="mb-2 text-sm font-medium text-slate-500">
                                            Prescriptions ({selectedConsultation.prescriptions.length})
                                        </p>
                                        <div className="space-y-2">
                                            {selectedConsultation.prescriptions.map((rx) => (
                                                <div key={rx.id} className="rounded-lg bg-blue-50/80 p-3 backdrop-blur-sm">
                                                    <p className="font-medium text-blue-900">{rx.medication_name}</p>
                                                    <p className="text-sm text-blue-700">
                                                        {rx.dosage} • {rx.frequency} • {rx.duration}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {selectedConsultation.notes && (
                                    <div>
                                        <p className="text-sm font-medium text-slate-500">Notes</p>
                                        <p className="mt-1 whitespace-pre-wrap text-slate-800">{selectedConsultation.notes}</p>
                                    </div>
                                )}

                                {/* Follow-up */}
                                {selectedConsultation.follow_up_date && (
                                    <div className={`rounded-xl p-4 ${
                                        new Date(selectedConsultation.follow_up_date) > new Date()
                                            ? 'bg-yellow-50'
                                            : 'bg-slate-100'
                                    }`}>
                                        <p className={`flex items-center gap-2 text-sm font-medium ${
                                            new Date(selectedConsultation.follow_up_date) > new Date()
                                                ? 'text-yellow-800'
                                                : 'text-slate-600'
                                        }`}>
                                            <Calendar className="h-4 w-4" />
                                            Follow-up {new Date(selectedConsultation.follow_up_date) > new Date() ? 'Scheduled' : 'Date Passed'}
                                        </p>
                                        <p className={
                                            new Date(selectedConsultation.follow_up_date) > new Date()
                                                ? 'text-yellow-700'
                                                : 'text-slate-500'
                                        }>
                                            {formatDateTime(selectedConsultation.follow_up_date).date}
                                        </p>
                                    </div>
                                )}

                                {/* Medical History */}
                                {selectedConsultation.child_medical_notes && (
                                    <div className="rounded-xl bg-red-50/80 p-4 backdrop-blur-sm">
                                        <p className="flex items-center gap-2 text-sm font-medium text-red-800">
                                            <AlertTriangle className="h-4 w-4" />
                                            Patient Medical History
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                                            {selectedConsultation.child_medical_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}