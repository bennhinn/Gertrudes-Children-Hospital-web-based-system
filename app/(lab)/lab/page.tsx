'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface LabStats {
    pendingTests: number
    inProgress: number
    completedToday: number
    criticalResults: number
}

interface LabOrder {
    id: string
    test_type: string
    test_code: string | null
    urgency: 'stat' | 'urgent' | 'routine'
    status: string
    ordered_at: string
    special_instructions: string | null
    completed_at?: string
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

export default function LabDashboard() {
    const [stats, setStats] = useState<LabStats>({
        pendingTests: 0,
        inProgress: 0,
        completedToday: 0,
        criticalResults: 0,
    })
    const [pendingOrders, setPendingOrders] = useState<LabOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadDashboardData = useCallback(async () => {
        try {
            const supabase = createClient()
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Get all lab orders with proper joins
            // Note: lab_orders has two FKs to doctors (doctor_id and reviewed_by)
            // We need to specify which one using the FK name
            const { data: orders, error: ordersError } = await supabase
                .from('lab_orders')
                .select(`
          *,
          child:children(id, full_name, date_of_birth, gender),
          doctor:doctors!lab_orders_doctor_id_fkey(id, profiles(full_name))
        `)
                .order('ordered_at', { ascending: false })

            if (ordersError) {
                console.error('Lab orders error:', ordersError)
                setError(`Failed to load lab orders: ${ordersError.message}`)
            }

            const ordersData = orders || []

            // Calculate stats
            const pending = ordersData.filter(o => o.status === 'pending')
            const inProgress = ordersData.filter(o => o.status === 'in_progress' || o.status === 'collected')
            const completedToday = ordersData.filter(o =>
                o.status === 'completed' &&
                o.completed_at &&
                new Date(o.completed_at) >= today
            )

            // Get critical results (simplified - would check abnormal flags in real app)
            const { data: criticalResults } = await supabase
                .from('lab_results')
                .select('id, abnormal_flags')
                .gte('created_at', today.toISOString())

            const criticalCount = (criticalResults || []).filter(r =>
                r.abnormal_flags && Object.values(r.abnormal_flags).some(v => v === true)
            ).length

            setStats({
                pendingTests: pending.length,
                inProgress: inProgress.length,
                completedToday: completedToday.length,
                criticalResults: criticalCount,
            })

            // Get pending orders (stat and urgent first)
            const sortedPending = pending.sort((a, b) => {
                const urgencyOrder = { stat: 0, urgent: 1, routine: 2 }
                return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder]
            })
            setPendingOrders(sortedPending.slice(0, 10))
        } catch (error: any) {
            console.error('Error loading dashboard:', error)
            setError(error.message || 'Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDashboardData()

        // Real-time subscription
        const supabase = createClient()
        const channel = supabase
            .channel('lab-dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lab_orders' },
                () => loadDashboardData()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadDashboardData])

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

    async function collectSample(orderId: string) {
        try {
            const supabase = createClient()
            
            const { error } = await supabase
                .from('lab_orders')
                .update({ 
                    status: 'collected',
                    collected_at: new Date().toISOString()
                })
                .eq('id', orderId)

            if (error) throw error

            loadDashboardData()
        } catch (error) {
            console.error('Error collecting sample:', error)
            alert('Failed to update sample status')
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 w-24 rounded bg-slate-200"></div>
                                <div className="mt-2 h-8 w-16 rounded bg-slate-200"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            {/* Error Display */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-red-800">
                            ⚠️ Error: {error}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Welcome Header */}
            <div className="rounded-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-green-500 p-6 text-white shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Laboratory Dashboard</h1>
                        <p className="mt-1 text-yellow-100">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/lab/orders">
                            <Button className="bg-white text-yellow-600 hover:bg-yellow-50">
                                📋 View All Orders
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-200 text-2xl">
                                <span className="relative">
                                    📋
                                    {stats.pendingTests > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
                                            <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow-500"></span>
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pending Tests</p>
                                <p className="text-3xl font-bold text-yellow-600">{stats.pendingTests}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 text-2xl">
                                🔬
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">In Progress</p>
                                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-200 text-2xl">
                                ✅
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Completed Today</p>
                                <p className="text-3xl font-bold text-green-600">{stats.completedToday}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-200 text-2xl">
                                ⚠️
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Critical Results</p>
                                <p className="text-3xl font-bold text-red-600">{stats.criticalResults}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Link href="/lab/orders">
                            <Button variant="secondary" className="h-auto w-full flex-col gap-2 py-4">
                                <span className="text-2xl">📋</span>
                                <span>View Orders</span>
                            </Button>
                        </Link>
                        <Link href="/lab/results">
                            <Button variant="secondary" className="h-auto w-full flex-col gap-2 py-4">
                                <span className="text-2xl">📊</span>
                                <span>Enter Results</span>
                            </Button>
                        </Link>
                        <Button variant="secondary" className="h-auto flex-col gap-2 py-4" disabled>
                            <span className="text-2xl">🖨️</span>
                            <span>Print Worklist</span>
                        </Button>
                        <Link href="/lab/completed">
                            <Button variant="secondary" className="h-auto w-full flex-col gap-2 py-4">
                                <span className="text-2xl">✅</span>
                                <span>Completed</span>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Pending Orders */}
            <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Pending Test Orders</CardTitle>
                    <Link href="/lab/orders">
                        <Button variant="ghost" size="sm">
                            View All →
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {pendingOrders.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-3xl">✨</p>
                            <p className="mt-2 text-slate-500">No pending test orders</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className={`rounded-xl border p-4 transition-all ${order.urgency === 'stat'
                                            ? 'border-red-200 bg-red-50/50'
                                            : order.urgency === 'urgent'
                                                ? 'border-yellow-200 bg-yellow-50/50'
                                                : 'border-slate-200 bg-slate-50/50'
                                        }`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white ${order.urgency === 'stat'
                                                    ? 'bg-gradient-to-br from-red-400 to-red-600'
                                                    : order.urgency === 'urgent'
                                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                                                        : 'bg-gradient-to-br from-blue-400 to-blue-600'
                                                }`}>
                                                🧪
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-slate-800">{order.test_type}</h3>
                                                    {getUrgencyBadge(order.urgency)}
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    {order.child?.full_name || 'Unknown'} •{' '}
                                                    {order.child?.date_of_birth ? getAge(order.child.date_of_birth) : ''}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Dr. {order.doctor?.profiles?.full_name || 'Unknown'} • {getTimeAgo(order.ordered_at)}
                                                </p>
                                            </div>
                                        </div>

                                        <Button 
                                            size="sm" 
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => collectSample(order.id)}
                                        >
                                            Collect Sample
                                        </Button>
                                    </div>

                                    {order.special_instructions && (
                                        <div className="mt-3 rounded-lg bg-yellow-100 p-2">
                                            <p className="text-xs text-yellow-800">⚠️ {order.special_instructions}</p>
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