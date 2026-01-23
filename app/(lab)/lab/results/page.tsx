'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface LabOrder {
    id: string
    child_id: string
    doctor_id: string
    test_id: string
    test_name: string
    priority: 'routine' | 'urgent' | 'stat'
    // FIX: Updated status to match DB schema
    status: 'pending' | 'collected' | 'in_progress' | 'completed' 
    clinical_notes: string | null
    special_instructions: string | null
    ordered_at: string
    collected_at: string | null
    completed_at: string | null
    processing_started_at: string | null
    results: string | null
    result_notes: string | null
    abnormal_findings: string | null
    child: {
        full_name: string
        date_of_birth: string
    } | null
    doctor: {
        profiles: {
            full_name: string
        } | null
    } | null
}

export default function LabEnterResultsPage() {
    const [orders, setOrders] = useState<LabOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // FIX: Updated filter state type
    const [filter, setFilter] = useState<'all' | 'collected' | 'in_progress'>('collected')
    const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null)
    const [showResultModal, setShowResultModal] = useState(false)
    const [resultForm, setResultForm] = useState({
        results: '',
        result_notes: '',
        abnormal_findings: ''
    })
    const [savingResult, setSavingResult] = useState(false)

    const loadOrders = useCallback(async () => {
        try {
            setError(null)
            const supabase = createClient()

            // FIX: Query for 'in_progress' instead of 'processing'
            const { data, error } = await supabase
                .from('lab_orders')
                .select(`
                    *,
                    child:children(full_name, date_of_birth),
                    doctor:doctors!lab_orders_doctor_id_fkey(profiles(full_name))
                `)
                .in('status', ['collected', 'in_progress']) 
                .order('collected_at', { ascending: true })

            if (error) {
                console.error('Database error:', error)
                setError(`Failed to load orders: ${error.message}`)
                return
            }

            console.log('Loaded orders:', data)
            setOrders(data as LabOrder[] || [])
        } catch (error: any) {
            console.error('Error loading orders:', error)
            setError(error.message || 'Failed to load orders')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadOrders()

        const supabase = createClient()
        const channel = supabase
            .channel('lab-results')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lab_orders' },
                (payload) => {
                    console.log('Real-time update:', payload)
                    loadOrders()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadOrders])

    function getAge(dateOfBirth: string) {
        if (!dateOfBirth) return 'N/A'
        
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
        return `${age} yrs`
    }

    function getPriorityColor(priority: string) {
        switch (priority) {
            case 'stat':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'urgent':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'routine':
                return 'bg-green-100 text-green-700 border-green-200'
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'collected':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            // FIX: Handle in_progress color
            case 'in_progress':
                return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-200'
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    function openResultModal(order: LabOrder) {
        setSelectedOrder(order)
        setResultForm({
            results: '', 
            result_notes: order.result_notes || '',
            abnormal_findings: order.abnormal_findings || ''
        })
        setShowResultModal(true)
    }

    async function handleStartProcessing(order: LabOrder) {
        try {
            const supabase = createClient()
            console.log('Starting processing for order:', order.id)

            // FIX: Update to 'in_progress' to match DB constraint
            const updateData = {
                status: 'in_progress',
                processing_started_at: new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('lab_orders')
                .update(updateData)
                .eq('id', order.id)
                .select()

            if (error) throw error

            console.log('Update successful:', data)
            loadOrders()
        } catch (error: any) {
            console.error('Error updating status:', error)
            alert(`Failed to update status: ${error.message}`)
        }
    }

    async function handleSaveResults() {
        if (!selectedOrder || !resultForm.results.trim()) {
            alert('Please enter test results')
            return
        }

        setSavingResult(true)
        try {
            const supabase = createClient()
            console.log('Saving results for order:', selectedOrder.id)

            const updateData = {
                status: 'completed',
                results: resultForm.results,
                result_notes: resultForm.result_notes || null,
                abnormal_findings: resultForm.abnormal_findings || null,
                completed_at: new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('lab_orders')
                .update(updateData)
                .eq('id', selectedOrder.id)
                .select()

            if (error) throw error

            console.log('Save successful:', data)

            setShowResultModal(false)
            setSelectedOrder(null)
            setResultForm({ results: '', result_notes: '', abnormal_findings: '' })
            alert('Results saved successfully!')
            loadOrders()
        } catch (error: any) {
            console.error('Error saving results:', error)
            alert(`Failed to save results: ${error.message}`)
        } finally {
            setSavingResult(false)
        }
    }

    const filteredOrders = filter === 'all' 
        ? orders 
        : orders.filter(o => o.status === filter)

    const collectedCount = orders.filter(o => o.status === 'collected').length
    // FIX: Count 'in_progress'
    const processingCount = orders.filter(o => o.status === 'in_progress').length

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="h-32 animate-pulse rounded-2xl bg-slate-200"></div>
                <div className="h-64 animate-pulse rounded-2xl bg-slate-200"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6 pb-20 lg:pb-6">
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-red-800">⚠️ {error}</p>
                        <Button onClick={loadOrders} size="sm" className="mt-2">Retry</Button>
                    </CardContent>
                </Card>
            )}

            <div className="rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">📊 Enter Results</h1>
                        <p className="mt-1 text-blue-100">Process collected samples and enter test results</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                        </span>
                        <span className="text-sm">Live updates</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 text-2xl">
                                🧪
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Ready for Processing</p>
                                <p className="text-3xl font-bold text-blue-600">{collectedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 text-2xl">
                                ⚗️
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">In Progress</p>
                                <p className="text-3xl font-bold text-purple-600">{processingCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        filter === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    All ({orders.length})
                </button>
                <button
                    onClick={() => setFilter('collected')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        filter === 'collected'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Collected ({collectedCount})
                </button>
                <button
                    onClick={() => setFilter('in_progress')}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        filter === 'in_progress'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    Processing ({processingCount})
                </button>
            </div>

            {/* Orders List */}
            <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                    {filteredOrders.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-4xl">✨</p>
                            <p className="mt-4 text-lg font-medium text-slate-600">No samples to process</p>
                            <p className="text-slate-400">
                                {filter === 'collected' 
                                    ? 'Samples will appear here after collection from the Test Orders page'
                                    : 'No samples in this status'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                                                    🧪
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold text-slate-800">
                                                            {order.test_name || 'Lab Test'}
                                                        </h3>
                                                        <Badge className={getPriorityColor(order.priority)}>
                                                            {order.priority.toUpperCase()}
                                                        </Badge>
                                                        <Badge className={getStatusColor(order.status)}>
                                                            {order.status === 'in_progress' ? 'PROCESSING' : order.status.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <p className="mt-1 text-sm text-slate-600">
                                                        <span className="font-medium">Patient:</span> {order.child?.full_name || 'Unknown'} 
                                                        {order.child?.date_of_birth && ` • ${getAge(order.child.date_of_birth)}`}
                                                    </p>
                                                    
                                                    <p className="text-sm text-slate-500">
                                                        <span className="font-medium">Ordered by:</span> Dr. {order.doctor?.profiles?.full_name || 'Unknown'}
                                                    </p>

                                                    {order.clinical_notes && (
                                                        <div className="mt-2 rounded-lg bg-yellow-50 p-2">
                                                            <p className="text-xs font-medium text-yellow-800">📋 Clinical Notes:</p>
                                                            <p className="text-xs text-yellow-700">{order.clinical_notes}</p>
                                                        </div>
                                                    )}

                                                    {order.special_instructions && (
                                                        <div className="mt-2 rounded-lg bg-purple-50 p-2">
                                                            <p className="text-xs font-medium text-purple-800">⚠️ Special Instructions:</p>
                                                            <p className="text-xs text-purple-700">{order.special_instructions}</p>
                                                        </div>
                                                    )}

                                                    <p className="mt-2 text-xs text-slate-400">
                                                        Collected: {order.collected_at ? new Date(order.collected_at).toLocaleString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {order.status === 'collected' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleStartProcessing(order)}
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                >
                                                    ▶️ Start Processing
                                                </Button>
                                            )}
                                            
                                            {/* FIX: Check for in_progress status */}
                                            {order.status === 'in_progress' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => openResultModal(order)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    📊 Enter Results
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Result Entry Modal - Same as before, logic handled by parent state */}
            {showResultModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-800">📊 Enter Test Results</h3>
                            <p className="text-sm text-slate-600 mt-1">
                                {selectedOrder.test_name} - {selectedOrder.child?.full_name}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Test Results *
                                </label>
                                <textarea
                                    value={resultForm.results}
                                    onChange={(e) => setResultForm({...resultForm, results: e.target.value})}
                                    rows={6}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none font-mono text-sm"
                                    placeholder="Enter test results here..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Abnormal Findings (if any)
                                </label>
                                <textarea
                                    value={resultForm.abnormal_findings}
                                    onChange={(e) => setResultForm({...resultForm, abnormal_findings: e.target.value})}
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-red-500 focus:outline-none"
                                    placeholder="List any values outside normal range or concerning findings..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={resultForm.result_notes}
                                    onChange={(e) => setResultForm({...resultForm, result_notes: e.target.value})}
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                    placeholder="Any additional observations..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button
                                onClick={handleSaveResults}
                                disabled={savingResult || !resultForm.results.trim()}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                {savingResult ? 'Saving...' : '✅ Save & Complete'}
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowResultModal(false)
                                    setSelectedOrder(null)
                                }}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}