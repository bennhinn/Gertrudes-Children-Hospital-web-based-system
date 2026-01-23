'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface LabOrder {
    id: string
    test_type: string
    test_code: string | null
    priority: 'stat' | 'urgent' | 'routine'
    status: string
    ordered_at: string
    completed_at: string | null
    special_instructions: string | null
    result_value: string | null
    result_unit: string | null
    reference_range: string | null
    interpretation: string | null
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

type PriorityFilter = 'all' | 'stat' | 'urgent' | 'routine'

export default function CompletedOrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<LabOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
    const [searchTerm, setSearchTerm] = useState('')

    const loadCompletedOrders = useCallback(async () => {
        try {
            const supabase = createClient()

            const { data, error } = await supabase
                .from('lab_orders')
                .select(`
                  *,
                  child:children(id, full_name, date_of_birth, gender),
                  doctor:doctors!lab_orders_doctor_id_fkey(id, profiles(full_name))
                `)
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })

            if (error) throw error

            setOrders(data as LabOrder[])
        } catch (error) {
            console.error('Error loading completed orders:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadCompletedOrders()

        const supabase = createClient()
        const channel = supabase
            .channel('completed-lab-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lab_orders', filter: 'status=eq.completed' },
                () => loadCompletedOrders()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadCompletedOrders])

    const filteredOrders = orders.filter(order => {
        if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false
        if (searchTerm && !order.child?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !order.test_type.toLowerCase().includes(searchTerm.toLowerCase())) return false
        return true
    })

    const stats = {
        total: orders.length,
        thisWeek: orders.filter(o => {
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return new Date(o.completed_at || '') > weekAgo
        }).length,
        thisMonth: orders.filter(o => {
            const monthAgo = new Date()
            monthAgo.setMonth(monthAgo.getMonth() - 1)
            return new Date(o.completed_at || '') > monthAgo
        }).length,
    }

    function getAge(dateOfBirth: string) {
        const today = new Date()
        const birthDate = new Date(dateOfBirth)
        let age = today.getFullYear() - birthDate.getFullYear()
        if (age < 1) {
            return 'Infant'
        }
        return `${age} yrs`
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    function getResultStatus(interpretation: string | null) {
        if (!interpretation) return 'default'
        const lower = interpretation.toLowerCase()
        if (lower.includes('normal')) return 'normal'
        if (lower.includes('high') || lower.includes('low') || lower.includes('abnormal')) return 'abnormal'
        return 'default'
    }

    if (loading) return <div className="p-6">Loading completed orders...</div>

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Completed Tests</h1>
                    <p className="text-slate-500">View all completed lab test results</p>
                </div>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl p-4 bg-green-50 shadow-sm">
                    <p className="text-sm text-green-700 font-medium">Total Completed</p>
                    <p className="text-2xl font-bold text-green-600">{stats.total}</p>
                </div>
                <div className="rounded-xl p-4 bg-blue-50 shadow-sm">
                    <p className="text-sm text-blue-700 font-medium">This Week</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.thisWeek}</p>
                </div>
                <div className="rounded-xl p-4 bg-purple-50 shadow-sm">
                    <p className="text-sm text-purple-700 font-medium">This Month</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.thisMonth}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4">
                <input
                    type="text"
                    placeholder="Search by patient name or test type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <div className="flex gap-2">
                    {(['all', 'stat', 'urgent', 'routine'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setPriorityFilter(f)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                                priorityFilter === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border'
                            }`}
                        >
                            {f === 'all' ? 'All Priority' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">{filteredOrders.length} Results Found</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {filteredOrders.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            {searchTerm ? 'No results match your search.' : 'No completed orders yet.'}
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className="rounded-xl border bg-white p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4 flex-1">
                                        <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-xl">✅</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold">{order.test_type}</h3>
                                                <Badge className="bg-green-50 text-green-700 border-green-200">
                                                    Completed
                                                </Badge>
                                                {order.interpretation && (
                                                    <Badge
                                                        variant={getResultStatus(order.interpretation) === 'normal' ? 'default' : 'secondary'}
                                                        className={getResultStatus(order.interpretation) === 'normal' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                    >
                                                        {order.interpretation}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Patient: {order.child?.full_name} ({getAge(order.child?.date_of_birth || '')})
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Dr. {order.doctor?.profiles.full_name} • Completed: {formatDate(order.completed_at)}
                                            </p>
                                            
                                            {order.result_value && (
                                                <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-slate-500">Result:</span>
                                                            <span className="ml-2 font-semibold text-slate-800">
                                                                {order.result_value} {order.result_unit}
                                                            </span>
                                                        </div>
                                                        {order.reference_range && (
                                                            <div>
                                                                <span className="text-slate-500">Reference:</span>
                                                                <span className="ml-2 text-slate-700">{order.reference_range}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="secondary"
                                        onClick={() => router.push(`/lab/results/${order.id}`)}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}