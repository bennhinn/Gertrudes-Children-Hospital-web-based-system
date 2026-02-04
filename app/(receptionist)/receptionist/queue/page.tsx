'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
    Search,
    X,
    ArrowLeft,
    RefreshCw,
    Phone,
    Clock,
    User,
    Stethoscope,
    CheckCircle,
    AlertCircle,
    Eye,
    Volume2,
    XCircle
} from 'lucide-react'

interface CheckIn {
    id: string
    checked_in_at: string
    status: string
    queue_number: number
    reason: string
    called_at: string | null
    completed_at: string | null
    appointment: {
        id: string
        scheduled_for: string
        child: {
            full_name: string
            date_of_birth: string
        }
        caregiver: {
            profiles: {
                full_name: string
                phone: string
            }
        }
    }
}

// Patient Details Modal Component
function PatientDetailsModal({
    isOpen,
    onClose,
    checkIn,
    onUpdateStatus,
    getWaitTime
}: {
    isOpen: boolean
    onClose: () => void
    checkIn: CheckIn | null
    onUpdateStatus: (id: string, status: string) => void
    getWaitTime: (time: string) => string
}) {
    if (!isOpen || !checkIn) return null

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const calculateAge = (dateOfBirth: string) => {
        if (!dateOfBirth) return 'Unknown'
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
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 p-0 lg:p-4" onClick={onClose}>
            <div
                className="relative w-full lg:max-w-lg animate-in slide-in-from-bottom lg:zoom-in-95 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="overflow-hidden rounded-t-3xl lg:rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className={`px-6 py-6 text-white ${checkIn.status === 'waiting'
                            ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                            : checkIn.status === 'in_consultation'
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                : 'bg-gradient-to-br from-green-500 to-emerald-600'
                        }`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
                                        #{checkIn.queue_number}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{checkIn.appointment?.child?.full_name || 'Unknown'}</h2>
                                        <p className="text-sm opacity-90">{calculateAge(checkIn.appointment?.child?.date_of_birth)}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Status Banner */}
                        <div className={`rounded-xl p-4 flex items-center gap-3 ${checkIn.status === 'waiting'
                                ? 'bg-amber-50 border border-amber-200'
                                : checkIn.status === 'in_consultation'
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-green-50 border border-green-200'
                            }`}>
                            {checkIn.status === 'waiting' && (
                                <>
                                    <Clock className="h-5 w-5 text-amber-600" />
                                    <div>
                                        <p className="font-medium text-amber-800">Waiting</p>
                                        <p className="text-sm text-amber-600">Wait time: {getWaitTime(checkIn.checked_in_at)}</p>
                                    </div>
                                </>
                            )}
                            {checkIn.status === 'in_consultation' && (
                                <>
                                    <Stethoscope className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-blue-800">With Doctor</p>
                                        <p className="text-sm text-blue-600">Called at: {checkIn.called_at ? formatTime(checkIn.called_at) : 'N/A'}</p>
                                    </div>
                                </>
                            )}
                            {checkIn.status === 'completed' && (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-800">Completed</p>
                                        <p className="text-sm text-green-600">Completed at: {checkIn.completed_at ? formatTime(checkIn.completed_at) : 'N/A'}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Visit Details */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Visit Details</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Clock className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Checked In At</p>
                                        <p className="font-medium text-slate-700">{formatTime(checkIn.checked_in_at)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <AlertCircle className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Reason for Visit</p>
                                        <p className="font-medium text-slate-700">{checkIn.reason || 'General checkup'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Guardian Info */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Guardian Information</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <User className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Name</p>
                                        <p className="font-medium text-slate-700">{checkIn.appointment?.caregiver?.profiles?.full_name || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Phone className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Phone</p>
                                        <p className="font-medium text-slate-700">{checkIn.appointment?.caregiver?.profiles?.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-slate-100 p-4 space-y-2">
                        {checkIn.status === 'waiting' && (
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 h-12"
                                    onClick={() => { onUpdateStatus(checkIn.id, 'in_consultation'); onClose(); }}
                                >
                                    <Volume2 className="mr-2 h-4 w-4" />
                                    Call Patient
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-12 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => { onUpdateStatus(checkIn.id, 'completed'); onClose(); }}
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {checkIn.status === 'in_consultation' && (
                            <Button
                                className="w-full h-12 bg-green-600 hover:bg-green-700"
                                onClick={() => { onUpdateStatus(checkIn.id, 'completed'); onClose(); }}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Complete
                            </Button>
                        )}
                        {checkIn.status === 'completed' && (
                            <Button
                                variant="secondary"
                                className="w-full h-12"
                                onClick={onClose}
                            >
                                Close
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function QueuePage() {
    const [checkIns, setCheckIns] = useState<CheckIn[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'waiting' | 'in_consultation' | 'completed'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadQueue = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const { data, error: fetchError } = await supabase
                .from('check_ins')
                .select(`
                    *,
                    appointment:appointments(
                        id,
                        scheduled_for,
                        child:children(full_name, date_of_birth),
                        caregiver:caregivers(profiles(full_name, phone))
                    )
                `)
                .gte('checked_in_at', today.toISOString())
                .order('queue_number', { ascending: true })

            if (fetchError) {
                console.error('Supabase error:', fetchError)
                throw new Error(fetchError.message || 'Failed to load queue')
            }

            console.log('Loaded check-ins:', data?.length || 0, 'records')
            setCheckIns(data || [])
        } catch (err) {
            console.error('Error loading queue:', err)
            setError(err instanceof Error ? err.message : 'Failed to load queue. Please refresh the page.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadQueue()

        const supabase = createClient()
        const channel = supabase
            .channel('queue-changes')
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

    async function updateStatus(checkInId: string, newStatus: string) {
        try {
            const supabase = createClient()
            const updates: Record<string, unknown> = { status: newStatus }

            // Only add completed_at when marking as completed
            if (newStatus === 'completed') {
                updates.completed_at = new Date().toISOString()
            }

            const { error: updateError } = await supabase
                .from('check_ins')
                .update(updates)
                .eq('id', checkInId)

            if (updateError) {
                console.error('Update error:', updateError)
                setError(`Failed to update patient status: ${updateError.message}`)
                return
            }

            // Also update the appointment status if moving to with doctor
            // Note: Don't update appointment status here - it should remain as is
            // The check_in table tracks the queue status separately from appointment status

            loadQueue()
        } catch (err) {
            console.error('Error updating status:', err)
            setError(err instanceof Error ? err.message : 'Failed to update status')
        }
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

    function getStatusBadge(status: string) {
        switch (status) {
            case 'waiting':
                return <Badge variant="yellow">Waiting</Badge>
            case 'in_consultation':
                return <Badge variant="blue">With Doctor</Badge>
            case 'completed':
                return <Badge variant="green">Completed</Badge>
            default:
                return <Badge variant="gray">{status}</Badge>
        }
    }

    const waitingCount = checkIns.filter(c => c.status === 'waiting').length
    const inConsultationCount = checkIns.filter(c => c.status === 'in_consultation').length
    const completedCount = checkIns.filter(c => c.status === 'completed').length

    // Filter check-ins based on search query and status filter
    const filteredCheckIns = useMemo(() => {
        let filtered = checkIns

        // Apply status filter
        if (filter !== 'all') {
            filtered = filtered.filter(c => c.status === filter)
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter((checkIn) => {
                const childName = checkIn.appointment?.child?.full_name?.toLowerCase() || ''
                const caregiverName = checkIn.appointment?.caregiver?.profiles?.full_name?.toLowerCase() || ''
                const phone = checkIn.appointment?.caregiver?.profiles?.phone?.toLowerCase() || ''
                const reason = checkIn.reason?.toLowerCase() || ''
                const queueNumber = String(checkIn.queue_number)

                return (
                    childName.includes(query) ||
                    caregiverName.includes(query) ||
                    phone.includes(query) ||
                    reason.includes(query) ||
                    queueNumber.includes(query)
                )
            })
        }

        return filtered
    }, [checkIns, searchQuery, filter])

    function openPatientDetails(checkIn: CheckIn) {
        setSelectedCheckIn(checkIn)
        setShowDetailsModal(true)
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 animate-pulse rounded bg-slate-200"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-20 lg:space-y-6 lg:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Link href="/receptionist">
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 lg:h-10 lg:w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 lg:text-2xl">Queue Management</h1>
                        <p className="text-xs text-slate-500 lg:text-sm">
                            {waitingCount} waiting • {inConsultationCount} with doctor
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    onClick={() => loadQueue()}
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 lg:p-4 lg:text-base flex items-center gap-2">
                    <span>❌</span>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => { setError(null); loadQueue(); }} className="text-red-500 hover:text-red-700 underline text-xs">
                        Retry
                    </button>
                </div>
            )}

            {/* Stats Cards - Clickable for filtering */}
            <div className="grid grid-cols-3 gap-2 lg:gap-3">
                <button
                    onClick={() => setFilter(filter === 'waiting' ? 'all' : 'waiting')}
                    className={`rounded-xl p-3 text-left transition-all lg:p-4 ${filter === 'waiting'
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                            : 'bg-amber-50 border border-amber-200'
                        }`}
                >
                    <p className={`text-xs font-medium ${filter === 'waiting' ? 'text-amber-100' : 'text-amber-600'}`}>Waiting</p>
                    <p className={`text-2xl font-bold lg:text-3xl ${filter === 'waiting' ? 'text-white' : 'text-amber-700'}`}>{waitingCount}</p>
                </button>
                <button
                    onClick={() => setFilter(filter === 'in_consultation' ? 'all' : 'in_consultation')}
                    className={`rounded-xl p-3 text-left transition-all lg:p-4 ${filter === 'in_consultation'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-blue-50 border border-blue-200'
                        }`}
                >
                    <p className={`text-xs font-medium ${filter === 'in_consultation' ? 'text-blue-100' : 'text-blue-600'}`}>With Doctor</p>
                    <p className={`text-2xl font-bold lg:text-3xl ${filter === 'in_consultation' ? 'text-white' : 'text-blue-700'}`}>{inConsultationCount}</p>
                </button>
                <button
                    onClick={() => setFilter(filter === 'completed' ? 'all' : 'completed')}
                    className={`rounded-xl p-3 text-left transition-all lg:p-4 ${filter === 'completed'
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                            : 'bg-green-50 border border-green-200'
                        }`}
                >
                    <p className={`text-xs font-medium ${filter === 'completed' ? 'text-green-100' : 'text-green-600'}`}>Done</p>
                    <p className={`text-2xl font-bold lg:text-3xl ${filter === 'completed' ? 'text-white' : 'text-green-700'}`}>{completedCount}</p>
                </button>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by patient, queue #, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Filter indicator */}
            {(filter !== 'all' || searchQuery) && (
                <div className="flex items-center gap-2 flex-wrap">
                    {filter !== 'all' && (
                        <Badge
                            className={`cursor-pointer ${filter === 'waiting' ? 'bg-amber-100 text-amber-700' :
                                    filter === 'in_consultation' ? 'bg-blue-100 text-blue-700' :
                                        'bg-green-100 text-green-700'
                                }`}
                            onClick={() => setFilter('all')}
                        >
                            {filter === 'waiting' ? 'Waiting' : filter === 'in_consultation' ? 'With Doctor' : 'Completed'}
                            <X className="ml-1 h-3 w-3" />
                        </Badge>
                    )}
                    {searchQuery && (
                        <span className="text-sm text-slate-500">
                            {filteredCheckIns.length} result{filteredCheckIns.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}

            {/* Queue List */}
            {filteredCheckIns.length === 0 ? (
                <Card className="border-none shadow-lg">
                    <CardContent className="py-10 text-center lg:py-12">
                        <p className="text-4xl">{searchQuery ? '🔍' : filter !== 'all' ? '✓' : '📋'}</p>
                        <p className="mt-3 text-base font-medium text-slate-600 lg:mt-4 lg:text-lg">
                            {searchQuery ? 'No matching patients found' :
                                filter === 'waiting' ? 'No patients waiting' :
                                    filter === 'in_consultation' ? 'No patients with doctor' :
                                        filter === 'completed' ? 'No completed visits today' :
                                            'Queue is empty'}
                        </p>
                        <p className="text-sm text-slate-400">
                            {searchQuery
                                ? 'Try adjusting your search term'
                                : filter !== 'all' ? 'Try a different filter' : 'Check in patients to add them to the queue'}
                        </p>
                        {(searchQuery || filter !== 'all') && (
                            <Button
                                onClick={() => { setSearchQuery(''); setFilter('all'); }}
                                className="mt-4"
                                variant="secondary"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredCheckIns.map((checkIn, index) => (
                        <Card
                            key={checkIn.id}
                            className={`border-none shadow-md hover:shadow-lg transition-all cursor-pointer ${checkIn.status === 'waiting' && index === 0 ? 'ring-2 ring-amber-400 ring-offset-2' : ''
                                }`}
                            onClick={() => openPatientDetails(checkIn)}
                        >
                            <CardContent className="p-4 lg:p-5">
                                <div className="flex items-center gap-4">
                                    {/* Queue Number */}
                                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold lg:h-16 lg:w-16 lg:text-2xl ${checkIn.status === 'waiting'
                                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30'
                                            : checkIn.status === 'in_consultation'
                                                ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                                                : 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                                        }`}>
                                        {checkIn.queue_number}
                                    </div>

                                    {/* Patient Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-slate-800 truncate text-base lg:text-lg">
                                                {checkIn.appointment?.child?.full_name || 'Unknown'}
                                            </p>
                                            {checkIn.status === 'waiting' && index === 0 && (
                                                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Next</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 mt-0.5 truncate">
                                            {checkIn.appointment?.caregiver?.profiles?.full_name || 'Unknown'} • 📞 {checkIn.appointment?.caregiver?.profiles?.phone || 'N/A'}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {getWaitTime(checkIn.checked_in_at)}
                                            </span>
                                            <span className="hidden lg:inline">{checkIn.reason}</span>
                                        </div>
                                    </div>

                                    {/* Status Badge - Desktop Only */}
                                    <div className="hidden lg:block shrink-0">
                                        {getStatusBadge(checkIn.status)}
                                    </div>

                                    {/* Action Buttons - Always Visible on Desktop */}
                                    <div className="hidden lg:flex items-center gap-2 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => { e.stopPropagation(); openPatientDetails(checkIn); }}
                                        >
                                            <Eye className="mr-1.5 h-4 w-4" />
                                            View
                                        </Button>

                                        {checkIn.status === 'waiting' && (
                                            <Button
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                                                onClick={(e) => { e.stopPropagation(); updateStatus(checkIn.id, 'in_consultation'); }}
                                            >
                                                <Volume2 className="mr-2 h-4 w-4" />
                                                Call Patient
                                            </Button>
                                        )}
                                        {checkIn.status === 'in_consultation' && (
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                                                onClick={(e) => { e.stopPropagation(); updateStatus(checkIn.id, 'completed'); }}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Complete
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile Action Buttons */}
                                {(checkIn.status === 'waiting' || checkIn.status === 'in_consultation') && (
                                    <div className="flex gap-2 mt-4 lg:hidden">
                                        {checkIn.status === 'waiting' && (
                                            <>
                                                <Button
                                                    className="flex-1 h-10"
                                                    onClick={(e) => { e.stopPropagation(); updateStatus(checkIn.id, 'in_consultation'); }}
                                                >
                                                    <Volume2 className="mr-2 h-4 w-4" />
                                                    Call Patient
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    className="h-10 text-red-500"
                                                    onClick={(e) => { e.stopPropagation(); updateStatus(checkIn.id, 'completed'); }}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        {checkIn.status === 'in_consultation' && (
                                            <Button
                                                className="flex-1 h-10 bg-green-600 hover:bg-green-700"
                                                onClick={(e) => { e.stopPropagation(); updateStatus(checkIn.id, 'completed'); }}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Mark Complete
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Patient Details Modal */}
            <PatientDetailsModal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                checkIn={selectedCheckIn}
                onUpdateStatus={updateStatus}
                getWaitTime={getWaitTime}
            />
        </div>
    )
}