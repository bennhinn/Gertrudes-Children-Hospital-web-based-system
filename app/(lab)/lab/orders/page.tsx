'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity-logger'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface LabOrder {
    id: string
    test_type: string
    test_code: string | null
    urgency: 'stat' | 'urgent' | 'routine'
    status: string
    ordered_at: string
    special_instructions: string | null
    child: {
        id: string
        full_name: string
        date_of_birth: string
        gender: string
    } | null
    doctor: {
        id: string
        profiles: {
            full_name: string
        }
    } | null
}

type StatusFilter = 'all' | 'pending' | 'collected' | 'in_progress'
type UrgencyFilter = 'all' | 'stat' | 'urgent' | 'routine'

export default function LabOrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<LabOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all')
    const [updating, setUpdating] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const loadOrders = useCallback(async () => {
        try {
            const supabase = createClient()

            // Use the specific FK name to avoid ambiguity
            let query = supabase
                .from('lab_orders')
                .select(`
          *,
          child:children(id, full_name, date_of_birth, gender),
          doctor:doctors!lab_orders_doctor_id_fkey(id, profiles(full_name))
        `)
                .in('status', ['pending', 'collected', 'in_progress'])
                .order('ordered_at', { ascending: false })

            const { data, error } = await query

            if (error) throw error

            // Sort by urgency (stat first) then by order time
            const sortedData = (data || []).sort((a, b) => {
                const urgencyOrder = { stat: 0, urgent: 1, routine: 2 }
                const urgencyDiff = urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder]
                if (urgencyDiff !== 0) return urgencyDiff
                return new Date(a.ordered_at).getTime() - new Date(b.ordered_at).getTime()
            })

            setOrders(sortedData)
        } catch (error) {
            console.error('Error loading orders:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadOrders()

        // Real-time subscription
        const supabase = createClient()
        const channel = supabase
            .channel('lab-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lab_orders' },
                () => loadOrders()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadOrders])

    async function updateOrderStatus(orderId: string, newStatus: string, orderInfo?: { testType: string, patientName: string }) {
        // Show confirmation for collecting samples
        if (newStatus === 'collected' && orderInfo) {
            const confirmed = window.confirm(
                `Collect sample for:\n\n` +
                `Test: ${orderInfo.testType || 'Lab Test'}\n` +
                `Patient: ${orderInfo.patientName}\n\n` +
                `Click OK to confirm sample collection.`
            )
            if (!confirmed) return
        }

        setUpdating(orderId)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            const updateData: any = { status: newStatus }

            // Add timestamp and user based on status
            if (newStatus === 'collected') {
                updateData.collected_at = new Date().toISOString()
                if (user?.id) {
                    updateData.collected_by = user.id
                }
            } else if (newStatus === 'in_progress') {
                // Use processing_started_at to match DB field used elsewhere
                updateData.processing_started_at = new Date().toISOString()
            }

            console.log('Updating order:', orderId, 'with data:', updateData)

            const { data, error } = await supabase
                .from('lab_orders')
                .update(updateData)
                .eq('id', orderId)
                .select()

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            console.log('Update successful:', data)

            // Show success message
            if (newStatus === 'collected') {
                alert(`✅ Sample collected successfully!\n\nThe sample is ready for processing.`)
            }

            // Log the lab order status update
            const actionName = newStatus === 'collected' ? 'collect_sample' :
                newStatus === 'in_progress' ? 'start_processing' :
                    `update_lab_order_${newStatus}`
            await logActivity({
                action: actionName,
                target_table: 'lab_order',
                target_id: orderId,
                description: `${newStatus === 'collected' ? 'Collected sample' :
                    newStatus === 'in_progress' ? 'Started processing' :
                        `Updated status to ${newStatus}`} for ${orderInfo?.testType || 'lab test'} - Patient: ${orderInfo?.patientName || 'Unknown'}`,
                metadata: {
                    test_type: orderInfo?.testType,
                    patient_name: orderInfo?.patientName,
                    new_status: newStatus
                }
            })

            await loadOrders()
        } catch (error: any) {
            console.error('Error updating order:', error)
            alert(`❌ Failed to update order status.\n\nError: ${error.message || 'Unknown error'}\n\nPlease try again.`)
        } finally {
            setUpdating(null)
        }
    }

    function getUrgencyBadge(urgency: string) {
        switch (urgency) {
            case 'stat':
                return <Badge variant="red" className="animate-pulse">STAT</Badge>
            case 'urgent':
                return <Badge variant="yellow">Urgent</Badge>
            default:
                return <Badge variant="blue">Routine</Badge>
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'pending':
                return <Badge variant="yellow">Pending</Badge>
            case 'collected':
                return <Badge variant="blue">Collected</Badge>
            case 'in_progress':
                return <Badge variant="purple">Processing</Badge>
            default:
                return <Badge variant="gray">{status}</Badge>
        }
    }

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

    // Filter orders
    const filteredOrders = orders.filter(order => {
        if (statusFilter !== 'all' && order.status !== statusFilter) return false
        if (urgencyFilter !== 'all' && order.urgency !== urgencyFilter) return false
        return true
    })

    // Search within filtered orders
    const searchedOrders = useMemo(() => {
        if (!searchQuery.trim()) return filteredOrders

        const query = searchQuery.toLowerCase()
        return filteredOrders.filter((order) => {
            const testType = order.test_type?.toLowerCase() || ''
            const testCode = order.test_code?.toLowerCase() || ''
            const patientName = order.child?.full_name?.toLowerCase() || ''
            const doctorName = order.doctor?.profiles?.full_name?.toLowerCase() || ''
            const instructions = order.special_instructions?.toLowerCase() || ''

            return (
                testType.includes(query) ||
                testCode.includes(query) ||
                patientName.includes(query) ||
                doctorName.includes(query) ||
                instructions.includes(query)
            )
        })
    }, [filteredOrders, searchQuery])

    // Stats
    const stats = {
        pending: orders.filter(o => o.status === 'pending').length,
        collected: orders.filter(o => o.status === 'collected').length,
        inProgress: orders.filter(o => o.status === 'in_progress').length,
        stat: orders.filter(o => o.urgency === 'stat' && o.status === 'pending').length,
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
        <div className="space-y-4 px-1 pb-24 lg:space-y-6 lg:px-0 lg:pb-6">
            {/* Header - compact on mobile */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 lg:text-2xl">Test Orders</h1>
                    <p className="text-sm text-slate-500">Pending & in-progress orders</p>
                </div>
                {stats.stat > 0 && (
                    <div className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1.5 lg:px-4 lg:py-2">
                        <span className="relative flex h-2.5 w-2.5 lg:h-3 lg:w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 lg:h-3 lg:w-3"></span>
                        </span>
                        <span className="text-xs font-medium text-red-700 lg:text-sm">{stats.stat} STAT</span>
                    </div>
                )}
            </div>

            {/* Stats Row - horizontal scroll on mobile */}
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:pb-0">
                <button
                    onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                    className={`flex-shrink-0 min-w-[120px] rounded-xl p-3 text-left transition-all lg:min-w-0 lg:p-4 ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''
                        } bg-gradient-to-br from-yellow-50 to-orange-50 shadow-md active:scale-95 lg:hover:shadow-lg`}
                >
                    <p className="text-xs text-yellow-700 lg:text-sm">Pending</p>
                    <p className="text-xl font-bold text-yellow-600 lg:text-2xl">{stats.pending}</p>
                </button>
                <button
                    onClick={() => setStatusFilter(statusFilter === 'collected' ? 'all' : 'collected')}
                    className={`flex-shrink-0 min-w-[120px] rounded-xl p-3 text-left transition-all lg:min-w-0 lg:p-4 ${statusFilter === 'collected' ? 'ring-2 ring-blue-500' : ''
                        } bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md active:scale-95 lg:hover:shadow-lg`}
                >
                    <p className="text-xs text-blue-700 lg:text-sm">Collected</p>
                    <p className="text-xl font-bold text-blue-600 lg:text-2xl">{stats.collected}</p>
                </button>
                <button
                    onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
                    className={`flex-shrink-0 min-w-[120px] rounded-xl p-3 text-left transition-all lg:min-w-0 lg:p-4 ${statusFilter === 'in_progress' ? 'ring-2 ring-purple-500' : ''
                        } bg-gradient-to-br from-purple-50 to-purple-100 shadow-md active:scale-95 lg:hover:shadow-lg`}
                >
                    <p className="text-xs text-purple-700 lg:text-sm">Processing</p>
                    <p className="text-xl font-bold text-purple-600 lg:text-2xl">{stats.inProgress}</p>
                </button>
            </div>

            {/* Urgency Filter - scrollable pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {(['all', 'stat', 'urgent', 'routine'] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setUrgencyFilter(filter)}
                        className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${urgencyFilter === filter
                            ? filter === 'stat'
                                ? 'bg-red-500 text-white shadow-md'
                                : filter === 'urgent'
                                    ? 'bg-yellow-500 text-white shadow-md'
                                    : filter === 'routine'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-slate-800 text-white shadow-md'
                            : 'bg-white text-slate-600 shadow-sm active:bg-slate-100'
                            }`}
                    >
                        {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                ))}
            </div>

            {/* Search Input - sticky on scroll */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search patient, test, doctor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-base shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 lg:py-2.5 lg:text-sm"
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

            {/* Search Results Count */}
            {searchQuery && (
                <p className="text-sm text-slate-500">
                    Found {searchedOrders.length} order{searchedOrders.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                </p>
            )}

            {/* Orders List */}
            <Card className="border-none shadow-md lg:shadow-lg">
                <CardHeader className="pb-2 lg:pb-4">
                    <CardTitle className="text-base lg:text-lg">
                        {searchedOrders.length} Order{searchedOrders.length !== 1 ? 's' : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
                    {searchedOrders.length === 0 ? (
                        <div className="py-8 text-center lg:py-12">
                            <p className="text-3xl lg:text-4xl">{searchQuery ? '🔍' : '✨'}</p>
                            <p className="mt-3 text-base font-medium text-slate-600 lg:mt-4 lg:text-lg">
                                {searchQuery ? 'No matching orders' : 'No orders found'}
                            </p>
                            <p className="text-sm text-slate-400">
                                {searchQuery ? 'Try a different search' : 'Adjust filters to see more'}
                            </p>
                            {searchQuery && (
                                <Button
                                    onClick={() => setSearchQuery('')}
                                    size="sm"
                                    className="mt-3 bg-slate-200 text-slate-700 hover:bg-slate-300"
                                >
                                    Clear Search
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 lg:space-y-4">
                            {searchedOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className={`rounded-xl border p-3 transition-all active:scale-[0.99] lg:p-4 ${order.urgency === 'stat'
                                        ? 'border-red-200 bg-red-50/50'
                                        : order.urgency === 'urgent'
                                            ? 'border-yellow-200 bg-yellow-50/50'
                                            : 'border-slate-200 bg-white'
                                        }`}
                                >
                                    {/* Mobile-optimized card layout */}
                                    <div className="flex items-start gap-3">
                                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl text-white lg:h-14 lg:w-14 lg:text-2xl ${order.urgency === 'stat'
                                            ? 'bg-gradient-to-br from-red-400 to-red-600'
                                            : order.urgency === 'urgent'
                                                ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                : 'bg-gradient-to-br from-blue-400 to-blue-600'
                                            }`}>
                                            🧪
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-semibold text-slate-800 lg:text-base">{order.test_type}</h3>
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                {getUrgencyBadge(order.urgency)}
                                                {getStatusBadge(order.status)}
                                            </div>
                                            {order.test_code && (
                                                <p className="mt-1 text-[11px] text-slate-500 lg:text-xs">Code: {order.test_code}</p>
                                            )}
                                            <p className="mt-1 text-xs text-slate-600 lg:text-sm">
                                                <span className="font-medium">Patient:</span> {order.child?.full_name || 'Unknown'}{' '}
                                                <span className="text-slate-400">•</span>{' '}
                                                {order.child?.date_of_birth ? getAge(order.child.date_of_birth) : ''}
                                            </p>
                                            <p className="text-[11px] text-slate-500 lg:text-xs">
                                                Dr. {order.doctor?.profiles?.full_name || 'Unknown'} • {getTimeAgo(order.ordered_at)}
                                            </p>

                                            {order.special_instructions && (
                                                <div className="mt-2 rounded-lg bg-yellow-100 p-2">
                                                    <p className="text-[11px] text-yellow-800 lg:text-xs">⚠️ {order.special_instructions}</p>
                                                </div>
                                            )}

                                            {/* Action button - full width on mobile */}
                                            <div className="mt-3">
                                                {order.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateOrderStatus(
                                                            order.id,
                                                            'collected',
                                                            {
                                                                testType: order.test_type,
                                                                patientName: order.child?.full_name || 'Unknown'
                                                            }
                                                        )}
                                                        disabled={updating === order.id}
                                                        className="w-full bg-blue-600 text-sm hover:bg-blue-700 lg:w-auto"
                                                    >
                                                        {updating === order.id ? '...' : '💉 Collect Sample'}
                                                    </Button>
                                                )}
                                                {order.status === 'collected' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateOrderStatus(order.id, 'in_progress')}
                                                        disabled={updating === order.id}
                                                        className="w-full bg-purple-600 text-sm hover:bg-purple-700 lg:w-auto"
                                                    >
                                                        {updating === order.id ? '...' : '🔬 Start Processing'}
                                                    </Button>
                                                )}
                                                {order.status === 'in_progress' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => router.push('/lab/results')}
                                                        className="w-full bg-green-600 text-sm hover:bg-green-700 lg:w-auto"
                                                    >
                                                        📊 Enter Results
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
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