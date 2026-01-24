'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface Prescription {
    id: string
    status: string
    urgency: string
    prescribed_at: string
    notes: string | null
    child_id: string
    doctor_id: string
    prescription_items: PrescriptionItem[]
    child: {
        id: string
        full_name: string
        date_of_birth: string
    } | null
    doctor: {
        id: string
        profiles: {
            full_name: string
        } | null
    } | null
}

interface PrescriptionItem {
    id: string
    medication_name: string
    dosage: string
    frequency: string
    duration: string
    quantity: number
    instructions: string | null
}

type StatusFilter = 'all' | 'pending' | 'preparing'
type UrgencyFilter = 'all' | 'stat' | 'urgent' | 'routine'

export default function PharmacyPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all')
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
    const [updating, setUpdating] = useState<string | null>(null)

    const loadPrescriptions = useCallback(async () => {
        try {
            const supabase = createClient()

            // FIX: Direct joins to child and doctor tables
            const { data, error } = await supabase
                .from('prescriptions')
                .select(`
          *,
          prescription_items(*),
          child:children(id, full_name, date_of_birth),
          doctor:doctors(id, profiles(full_name))
        `)
                .in('status', ['pending', 'preparing'])
                .order('prescribed_at', { ascending: true })

            if (error) throw error

            console.log('📋 Loaded prescriptions:', data?.length || 0)

            // Sort by urgency
            const sortedData = (data || []).sort((a, b) => {
                const urgencyOrder = { stat: 0, urgent: 1, routine: 2 }
                return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder]
            })

            setPrescriptions(sortedData)
        } catch (error) {
            console.error('Error loading prescriptions:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadPrescriptions()

        const supabase = createClient()
        const channel = supabase
            .channel('prescriptions-list')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'prescriptions' },
                () => loadPrescriptions()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadPrescriptions])

    async function updatePrescriptionStatus(id: string, newStatus: string) {
        setUpdating(id)
        try {
            const supabase = createClient()

            const updateData: Record<string, unknown> = { status: newStatus }
            if (newStatus === 'dispensed') {
                updateData.dispensed_at = new Date().toISOString()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    updateData.pharmacist_id = user.id
                }
            }

            const { error } = await supabase
                .from('prescriptions')
                .update(updateData)
                .eq('id', id)

            if (error) throw error

            if (selectedPrescription?.id === id && newStatus === 'dispensed') {
                setSelectedPrescription(null)
                alert('✅ Prescription dispensed successfully!')
            }
            loadPrescriptions()
        } catch (error) {
            console.error('Error updating prescription:', error)
            alert('❌ Failed to update prescription')
        } finally {
            setUpdating(null)
        }
    }

    function getAge(dob: string) {
        const today = new Date()
        const birthDate = new Date(dob)
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

    function getTimeAgo(dateString: string) {
        const now = new Date().getTime()
        const ordered = new Date(dateString).getTime()
        const diff = Math.round((now - ordered) / 60000)
        if (diff < 1) return 'Just now'
        if (diff < 60) return `${diff}m ago`
        const hours = Math.floor(diff / 60)
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
    }

    // Filter prescriptions
    const filteredPrescriptions = prescriptions.filter(p => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false
        if (urgencyFilter !== 'all' && p.urgency !== urgencyFilter) return false
        return true
    })

    // Stats
    const stats = {
        pending: prescriptions.filter(p => p.status === 'pending').length,
        preparing: prescriptions.filter(p => p.status === 'preparing').length,
        urgent: prescriptions.filter(p => (p.urgency === 'stat' || p.urgency === 'urgent') && p.status === 'pending').length,
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-24 animate-pulse rounded-xl bg-slate-200"></div>
                <div className="h-64 animate-pulse rounded-xl bg-slate-200"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Prescriptions</h1>
                    <p className="text-slate-500">Manage and dispense prescriptions</p>
                </div>
                {stats.urgent > 0 && (
                    <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2">
                        <span className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                        </span>
                        <span className="text-sm font-medium text-red-700">{stats.urgent} urgent prescription(s)</span>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                <button
                    onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                    className={`rounded-xl p-4 text-left transition-all ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''
                        } bg-gradient-to-br from-yellow-50 to-orange-50 shadow-md hover:shadow-lg`}
                >
                    <p className="text-sm text-yellow-700">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </button>
                <button
                    onClick={() => setStatusFilter(statusFilter === 'preparing' ? 'all' : 'preparing')}
                    className={`rounded-xl p-4 text-left transition-all ${statusFilter === 'preparing' ? 'ring-2 ring-blue-500' : ''
                        } bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md hover:shadow-lg`}
                >
                    <p className="text-sm text-blue-700">Preparing</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.preparing}</p>
                </button>
            </div>

            {/* Urgency Filter */}
            <div className="flex gap-2">
                {(['all', 'stat', 'urgent', 'routine'] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setUrgencyFilter(filter)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${urgencyFilter === filter
                            ? filter === 'stat'
                                ? 'bg-red-500 text-white'
                                : filter === 'urgent'
                                    ? 'bg-yellow-500 text-white'
                                    : filter === 'routine'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-slate-800 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Prescriptions List */}
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {filteredPrescriptions.length} Prescription{filteredPrescriptions.length !== 1 ? 's' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredPrescriptions.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-4xl">🎉</p>
                                <p className="mt-4 text-lg font-medium text-slate-600">All caught up!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredPrescriptions.map((prescription) => (
                                    <button
                                        key={prescription.id}
                                        onClick={() => setSelectedPrescription(prescription)}
                                        className={`w-full rounded-xl border p-4 text-left transition-all hover:shadow-md ${selectedPrescription?.id === prescription.id
                                            ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500'
                                            : prescription.urgency === 'stat'
                                                ? 'border-red-200 bg-red-50/50'
                                                : prescription.urgency === 'urgent'
                                                    ? 'border-yellow-200 bg-yellow-50/50'
                                                    : 'border-slate-100 bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white ${prescription.urgency === 'stat'
                                                ? 'bg-gradient-to-br from-red-400 to-red-600'
                                                : prescription.urgency === 'urgent'
                                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                    : 'bg-gradient-to-br from-cyan-400 to-teal-500'
                                                }`}>
                                                💊
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-800">
                                                        {prescription.child?.full_name || 'Unknown'}
                                                    </h3>
                                                    {prescription.urgency === 'stat' && (
                                                        <Badge variant="default" className="animate-pulse bg-red-500 text-white">STAT</Badge>
                                                    )}
                                                    {prescription.urgency === 'urgent' && (
                                                        <Badge className="bg-yellow-500 hover:bg-yellow-600">Urgent</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    {prescription.prescription_items?.length || 0} medication(s)
                                                </p>
                                                <p className="text-xs text-slate-400">{getTimeAgo(prescription.prescribed_at)}</p>
                                            </div>
                                            <Badge className={prescription.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                                                {prescription.status === 'pending' ? 'Pending' : 'Preparing'}
                                            </Badge>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Selected Prescription Detail */}
                <Card className={`border-none shadow-lg ${!selectedPrescription ? 'opacity-50' : ''}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <span>📋</span>
                            Prescription Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!selectedPrescription ? (
                            <div className="py-12 text-center">
                                <p className="text-4xl">👈</p>
                                <p className="mt-4 text-lg font-medium text-slate-600">Select a prescription</p>
                                <p className="text-slate-400">Choose from the list to view details</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Patient Info */}
                                <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 p-4">
                                    <h3 className="font-semibold text-slate-800">Patient Information</h3>
                                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                                        <p><strong>Name:</strong> {selectedPrescription.child?.full_name || 'Unknown'}</p>
                                        <p><strong>Age:</strong> {selectedPrescription.child?.date_of_birth ? getAge(selectedPrescription.child.date_of_birth) : 'N/A'}</p>
                                        <p><strong>Prescribing Doctor:</strong> Dr. {selectedPrescription.doctor?.profiles?.full_name || 'Unknown'}</p>
                                    </div>
                                </div>

                                {/* Medications */}
                                <div>
                                    <h3 className="mb-3 font-semibold text-slate-800">Medications</h3>
                                    <div className="space-y-3">
                                        {selectedPrescription.prescription_items?.map((item, index) => (
                                            <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700">
                                                                {index + 1}
                                                            </span>
                                                            <h4 className="font-semibold text-slate-800">{item.medication_name}</h4>
                                                        </div>
                                                        <div className="mt-2 space-y-1 text-sm text-slate-600">
                                                            <p><strong>Dosage:</strong> {item.dosage}</p>
                                                            <p><strong>Frequency:</strong> {item.frequency}</p>
                                                            <p><strong>Duration:</strong> {item.duration || 'Not specified'}</p>
                                                            <p><strong>Quantity:</strong> {item.quantity || 'Not specified'}</p>
                                                            {item.instructions && (
                                                                <p className="mt-2 rounded-lg bg-yellow-50 p-2 text-yellow-800">
                                                                    ⚠️ {item.instructions}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedPrescription.notes && (
                                    <div className="rounded-xl bg-yellow-50 p-4">
                                        <h3 className="font-semibold text-yellow-800">Notes</h3>
                                        <p className="mt-1 text-sm text-yellow-700">{selectedPrescription.notes}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    {selectedPrescription.status === 'pending' && (
                                        <Button
                                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                                            onClick={() => updatePrescriptionStatus(selectedPrescription.id, 'preparing')}
                                            disabled={updating === selectedPrescription.id}
                                        >
                                            {updating === selectedPrescription.id ? 'Updating...' : '⚗️ Start Preparing'}
                                        </Button>
                                    )}
                                    {selectedPrescription.status === 'preparing' && (
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => updatePrescriptionStatus(selectedPrescription.id, 'dispensed')}
                                            disabled={updating === selectedPrescription.id}
                                        >
                                            {updating === selectedPrescription.id ? 'Updating...' : '✅ Mark as Dispensed'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}