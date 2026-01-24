'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface DispensedPrescription {
    id: string
    status: string
    urgency: string
    prescribed_at: string
    dispensed_at: string | null
    notes: string | null
    child_id: string
    doctor_id: string
    pharmacist_id: string | null
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
    pharmacist: {
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

type TimeFilter = 'today' | 'week' | 'month' | 'all'

export default function PharmacyDispensedPage() {
    const [prescriptions, setPrescriptions] = useState<DispensedPrescription[]>([])
    const [loading, setLoading] = useState(true)
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
    const [selectedPrescription, setSelectedPrescription] = useState<DispensedPrescription | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const loadDispensedPrescriptions = useCallback(async () => {
        try {
            const supabase = createClient()

            // Calculate date range based on filter
            let dateFilter = new Date()
            if (timeFilter === 'today') {
                dateFilter.setHours(0, 0, 0, 0)
            } else if (timeFilter === 'week') {
                dateFilter.setDate(dateFilter.getDate() - 7)
            } else if (timeFilter === 'month') {
                dateFilter.setMonth(dateFilter.getMonth() - 1)
            }

            let query = supabase
                .from('prescriptions')
                .select(`
          *,
          prescription_items(*),
          child:children(id, full_name, date_of_birth),
          doctor:doctors(id, profiles(full_name)),
          pharmacist:pharmacists(id, profiles(full_name))
        `)
                .eq('status', 'dispensed')
                .order('dispensed_at', { ascending: false })

            // Apply time filter
            if (timeFilter !== 'all') {
                query = query.gte('dispensed_at', dateFilter.toISOString())
            }

            const { data, error } = await query

            if (error) throw error

            console.log('💊 Loaded dispensed prescriptions:', data?.length || 0)
            setPrescriptions(data || [])
        } catch (error) {
            console.error('Error loading dispensed prescriptions:', error)
        } finally {
            setLoading(false)
        }
    }, [timeFilter])

    useEffect(() => {
        loadDispensedPrescriptions()

        const supabase = createClient()
        const channel = supabase
            .channel('dispensed-prescriptions')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'prescriptions', filter: 'status=eq.dispensed' },
                () => loadDispensedPrescriptions()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadDispensedPrescriptions])

    // Filter by search term
    const filteredPrescriptions = prescriptions.filter(p => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            p.child?.full_name?.toLowerCase().includes(search) ||
            p.doctor?.profiles?.full_name?.toLowerCase().includes(search) ||
            p.prescription_items?.some(item => 
                item.medication_name?.toLowerCase().includes(search)
            )
        )
    })

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

    function formatDate(dateString: string | null) {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    function formatTime(dateString: string | null) {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        })
    }

    const stats = {
        total: filteredPrescriptions.length,
        today: prescriptions.filter(p => {
            if (!p.dispensed_at) return false
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return new Date(p.dispensed_at) >= today
        }).length,
        thisWeek: prescriptions.filter(p => {
            if (!p.dispensed_at) return false
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return new Date(p.dispensed_at) >= weekAgo
        }).length,
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
                    <h1 className="text-2xl font-bold text-slate-800">Dispensed History</h1>
                    <p className="text-slate-500">View all dispensed prescriptions</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-none bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700">Today</p>
                                <p className="text-3xl font-bold text-green-600">{stats.today}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                                ✅
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-700">This Week</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.thisWeek}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                                📊
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-700">Filtered</p>
                                <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
                                📦
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <input
                    type="text"
                    placeholder="Search by patient, doctor, or medication..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                    {(['today', 'week', 'month', 'all'] as const).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setTimeFilter(filter)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                timeFilter === filter
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border'
                            }`}
                        >
                            {filter === 'today' ? 'Today' : filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All Time'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Prescriptions List */}
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {filteredPrescriptions.length} Dispensed Prescription{filteredPrescriptions.length !== 1 ? 's' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                        {filteredPrescriptions.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-4xl">📦</p>
                                <p className="mt-4 text-lg font-medium text-slate-600">No dispensed prescriptions</p>
                                <p className="text-slate-400">{searchTerm ? 'Try adjusting your search' : 'Change the time filter'}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredPrescriptions.map((prescription) => (
                                    <button
                                        key={prescription.id}
                                        onClick={() => setSelectedPrescription(prescription)}
                                        className={`w-full rounded-xl border p-4 text-left transition-all hover:shadow-md ${
                                            selectedPrescription?.id === prescription.id
                                                ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
                                                : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-xl text-white">
                                                ✅
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-800">
                                                        {prescription.child?.full_name || 'Unknown'}
                                                    </h3>
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                                        Dispensed
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-500">
                                                    {prescription.prescription_items?.length || 0} medication(s) • Dr. {prescription.doctor?.profiles?.full_name || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {formatDate(prescription.dispensed_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Prescription Details */}
                <Card className={`border-none shadow-lg ${!selectedPrescription ? 'opacity-50' : ''}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <span>📋</span>
                            Prescription Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[600px] overflow-y-auto">
                        {!selectedPrescription ? (
                            <div className="py-12 text-center">
                                <p className="text-4xl">👈</p>
                                <p className="mt-4 text-lg font-medium text-slate-600">Select a prescription</p>
                                <p className="text-slate-400">Choose from the list to view details</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Dispensing Info */}
                                <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                                    <h3 className="font-semibold text-green-800">Dispensing Information</h3>
                                    <div className="mt-2 space-y-1 text-sm text-green-700">
                                        <p><strong>Dispensed:</strong> {formatDate(selectedPrescription.dispensed_at)}</p>
                                        <p><strong>Dispensed By:</strong> {selectedPrescription.pharmacist?.profiles?.full_name || 'Unknown'}</p>
                                        <p><strong>Time:</strong> {formatTime(selectedPrescription.dispensed_at)}</p>
                                    </div>
                                </div>

                                {/* Patient Info */}
                                <div className="rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 p-4">
                                    <h3 className="font-semibold text-slate-800">Patient Information</h3>
                                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                                        <p><strong>Name:</strong> {selectedPrescription.child?.full_name || 'Unknown'}</p>
                                        <p><strong>Age:</strong> {selectedPrescription.child?.date_of_birth ? getAge(selectedPrescription.child.date_of_birth) : 'N/A'}</p>
                                        <p><strong>Prescribed By:</strong> Dr. {selectedPrescription.doctor?.profiles?.full_name || 'Unknown'}</p>
                                        <p><strong>Prescribed:</strong> {formatDate(selectedPrescription.prescribed_at)}</p>
                                    </div>
                                </div>

                                {/* Medications */}
                                <div>
                                    <h3 className="mb-3 font-semibold text-slate-800">Dispensed Medications</h3>
                                    <div className="space-y-3">
                                        {selectedPrescription.prescription_items?.map((item, index) => (
                                            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="flex items-start gap-3">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-800">{item.medication_name}</h4>
                                                        <div className="mt-2 space-y-1 text-sm text-slate-600">
                                                            <p><strong>Dosage:</strong> {item.dosage}</p>
                                                            <p><strong>Frequency:</strong> {item.frequency}</p>
                                                            <p><strong>Duration:</strong> {item.duration || 'Not specified'}</p>
                                                            <p><strong>Quantity Dispensed:</strong> {item.quantity || 'Not specified'}</p>
                                                            {item.instructions && (
                                                                <div className="mt-2 rounded-lg bg-yellow-50 p-2">
                                                                    <p className="text-xs text-yellow-800">
                                                                        ⚠️ <strong>Instructions:</strong> {item.instructions}
                                                                    </p>
                                                                </div>
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
                                        <h3 className="font-semibold text-yellow-800">Additional Notes</h3>
                                        <p className="mt-1 text-sm text-yellow-700">{selectedPrescription.notes}</p>
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