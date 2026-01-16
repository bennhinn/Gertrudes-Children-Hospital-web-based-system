'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

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
        dob: string
        gender: string
    }
    doctor: {
        id: string
        profiles: {
            full_name: string
        }
    }
}

type StatusFilter = 'all' | 'pending' | 'collected' | 'in_progress'
type UrgencyFilter = 'all' | 'stat' | 'urgent' | 'routine'

export default function LabOrdersPage() {
    const [orders, setOrders] = useState<LabOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
    const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all')
    const [updating, setUpdating] = useState<string | null>(null)

    const loadOrders = useCallback(async () => {
        try {
            const supabase = createClient()

            let query = supabase
                .from('lab_orders')
                .select(`
          *,
          child:children(id, full_name, dob, gender),
          doctor:doctors(id, profiles(full_name))
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

    async function updateOrderStatus(orderId: string, newStatus: string) {
        setUpdating(orderId)
        try {
            const supabase = createClient()

            await supabase
                .from('lab_orders')
                .update({ status: newStatus })
                .eq('id', orderId)

            loadOrders()
        } catch (error) {
            console.error('Error updating order:', error)
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

    // Filter orders
    const filteredOrders = orders.filter(order => {
        if (statusFilter !== 'all' && order.status !== statusFilter) return false
        if (urgencyFilter !== 'all' && order.urgency !== urgencyFilter) return false
        return true
    })

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
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Test Orders</h1>
                    <p className="text-slate-500">Manage pending and in-progress lab orders</p>
                </div>
                {stats.stat > 0 && (
                    <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2">
                        <span className="relative flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                        </span>
                        <span className="text-sm font-medium text-red-700">{stats.stat} STAT orders pending</span>
                    </div>
                )}
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 sm:grid-cols-3">
                <button
                    onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
                    className={`rounded-xl p-4 text-left transition-all ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''
                        } bg-linear-to-br from-yellow-50 to-orange-50 shadow-md hover:shadow-lg`}
                >
                    <p className="text-sm text-yellow-700">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </button>
                <button
                    onClick={() => setStatusFilter(statusFilter === 'collected' ? 'all' : 'collected')}
                    className={`rounded-xl p-4 text-left transition-all ${statusFilter === 'collected' ? 'ring-2 ring-blue-500' : ''
                        } bg-linear-to-br from-blue-50 to-indigo-50 shadow-md hover:shadow-lg`}
                >
                    <p className="text-sm text-blue-700">Collected</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.collected}</p>
                </button>
                <button
                    onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
                    className={`rounded-xl p-4 text-left transition-all ${statusFilter === 'in_progress' ? 'ring-2 ring-purple-500' : ''
                        } bg-linear-to-br from-purple-50 to-purple-100 shadow-md hover:shadow-lg`}
                >
                    <p className="text-sm text-purple-700">Processing</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
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
                        {filter === 'all' ? 'All Urgency' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">
                        {filteredOrders.length} Order{filteredOrders.length !== 1 ? 's' : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredOrders.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-4xl">✨</p>
                            <p className="mt-4 text-lg font-medium text-slate-600">No orders found</p>
                            <p className="text-slate-400">Adjust your filters to see more</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className={`rounded-xl border p-4 transition-all ${order.urgency === 'stat'
                                            ? 'border-red-200 bg-red-50/50'
                                            : order.urgency === 'urgent'
                                                ? 'border-yellow-200 bg-yellow-50/50'
                                                : 'border-slate-200 bg-white'
                                        }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl text-white ${order.urgency === 'stat'
                                                    ? 'bg-linear-to-br from-red-400 to-red-600'
                                                    : order.urgency === 'urgent'
                                                        ? 'bg-linear-to-br from-yellow-400 to-orange-500'
                                                        : 'bg-linear-to-br from-blue-400 to-blue-600'
                                                }`}>
                                                🧪
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-semibold text-slate-800">{order.test_type}</h3>
                                                    {getUrgencyBadge(order.urgency)}
                                                    {getStatusBadge(order.status)}
                                                </div>
                                                {order.test_code && (
                                                    <p className="text-xs text-slate-500">Code: {order.test_code}</p>
                                                )}
                                                <p className="mt-1 text-sm text-slate-600">
                                                    Patient: {order.child?.full_name || 'Unknown'} •{' '}
                                                    {order.child?.dob ? getAge(order.child.dob) : ''}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Ordered by Dr. {order.doctor?.profiles?.full_name || 'Unknown'} • {getTimeAgo(order.ordered_at)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions based on status */}
                                        <div className="flex gap-2">
                                            {order.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateOrderStatus(order.id, 'collected')}
                                                    disabled={updating === order.id}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    {updating === order.id ? '...' : '💉 Collect Sample'}
                                                </Button>
                                            )}
                                            {order.status === 'collected' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateOrderStatus(order.id, 'in_progress')}
                                                    disabled={updating === order.id}
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                >
                                                    {updating === order.id ? '...' : '🔬 Start Processing'}
                                                </Button>
                                            )}
                                            {order.status === 'in_progress' && (
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    📊 Enter Results
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {order.special_instructions && (
                                        <div className="mt-3 rounded-lg bg-yellow-100 p-2">
                                            <p className="text-xs text-yellow-800">⚠️ Special Instructions: {order.special_instructions}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
